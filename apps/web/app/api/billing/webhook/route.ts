import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { planFromPriceId } from "@/lib/stripe/plans";
import type { PlanId } from "@chativo/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * Configure in Stripe Dashboard → Developers → Webhooks:
 *   Endpoint: {APP_URL}/api/billing/webhook
 *   Events:
 *     - checkout.session.completed
 *     - customer.subscription.created
 *     - customer.subscription.updated
 *     - customer.subscription.deleted
 *     - invoice.payment_succeeded
 *     - invoice.payment_failed
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) return new Response("stripe disabled", { status: 503 });

  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return new Response("missing signature or secret", { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return new Response(`signature_failed: ${(err as Error).message}`, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Idempotency
  const { data: prior } = await admin
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (prior) return Response.json({ received: true, skipped: true });

  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[billing webhook]", event.type, err);
    return new Response("handler_failed", { status: 500 });
  }

  // Record after successful processing
  await admin.from("billing_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event.data.object as object,
  });

  return Response.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.client_reference_id ?? null;
      if (!orgId) return;

      // Fetch the resulting subscription to get the active price → plan
      const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subId) return;

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(subId);
      const item = sub.items.data[0];
      const priceId = item?.price.id ?? null;
      const mapped = priceId ? planFromPriceId(priceId) : null;

      await applySubscription(orgId, sub, mapped?.planId ?? null);
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organization_id ?? null;
      if (!orgId) {
        // Fallback: look up via customer
        await applySubscriptionByCustomer(sub);
        return;
      }
      const item = sub.items.data[0];
      const priceId = item?.price.id ?? null;
      const mapped = priceId ? planFromPriceId(priceId) : null;
      await applySubscription(orgId, sub, mapped?.planId ?? null);
      return;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organization_id ?? null;
      const admin = getSupabaseAdmin();
      const filter = orgId
        ? admin.from("organizations").eq("id", orgId)
        : admin.from("organizations").eq("stripe_subscription_id", sub.id);
      await filter.update({
        plan_id: "free",
        subscription_status: "canceled",
        stripe_subscription_id: null,
        current_period_end: null,
      } as never);
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const admin = getSupabaseAdmin();
      await admin
        .from("organizations")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      return;
    }

    default:
      // Unknown event — recorded in billing_events but no state change.
      return;
  }
}

async function applySubscription(orgId: string, sub: Stripe.Subscription, planId: PlanId | null) {
  const admin = getSupabaseAdmin();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  await admin
    .from("organizations")
    .update({
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      ...(planId ? { plan_id: planId } : {}),
    })
    .eq("id", orgId);
}

async function applySubscriptionByCustomer(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;
  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!org) return;

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const mapped = priceId ? planFromPriceId(priceId) : null;
  await applySubscription(org.id as string, sub, mapped?.planId ?? null);
}
