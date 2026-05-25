import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { retrieveCheckoutForm } from "@/lib/iyzico/client";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import type { PlanId } from "@chativo/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * iyzico hosted-form callback. They POST x-www-form-urlencoded with `token`
 * after the user completes payment (success or failure).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!token) return Response.redirect(new URL("/billing?canceled=1", req.url));

  // We don't get conversationId in the callback body, but it's tied to the token.
  // Retrieve will return it.
  let detail: any;
  try {
    detail = await retrieveCheckoutForm(token, "callback");
  } catch {
    return Response.redirect(new URL("/billing?error=iyzico_verify", req.url));
  }

  if (detail.paymentStatus !== "SUCCESS") {
    return Response.redirect(new URL("/billing?canceled=1", req.url));
  }

  // Parse conversationId we set on init: orgId:planId:cadence:timestamp
  const parts = String(detail.conversationId ?? "").split(":");
  const [orgId, planId] = parts;
  if (!orgId || !planId) {
    return Response.redirect(new URL("/billing?error=parse_failed", req.url));
  }

  // Validate plan
  const validPlans: PlanId[] = ["starter", "pro", "agency"];
  if (!validPlans.includes(planId as PlanId)) {
    return Response.redirect(new URL("/billing?error=plan_invalid", req.url));
  }

  // Record billing event + upgrade plan
  const admin = getSupabaseAdmin();

  // Idempotency on iyzico paymentId
  const paymentId = detail.paymentId ?? null;
  if (paymentId) {
    const { data: prior } = await admin
      .from("billing_events")
      .select("id")
      .eq("stripe_event_id", `iyzico_${paymentId}`)
      .maybeSingle();
    if (prior) {
      return Response.redirect(new URL("/billing/success", req.url));
    }
  }

  // Upgrade
  await admin
    .from("organizations")
    .update({
      plan_id: planId as PlanId,
      subscription_status: "active",
      iyzico_customer_id: detail.cardUserKey ?? null,
      iyzico_subscription_id: detail.paymentId ?? null,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", orgId);

  // Log
  await admin.from("billing_events").insert({
    stripe_event_id: `iyzico_${paymentId ?? Date.now()}`,
    type: "iyzico.payment.success",
    organization_id: orgId,
    payload: detail,
    provider: "iyzico",
  });

  void PLAN_LIMITS; // ref guard for tree-shake
  return Response.redirect(new URL("/billing/success", req.url));
}
