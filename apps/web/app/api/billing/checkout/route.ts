import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { priceIdFor, isPaidPlan } from "@/lib/stripe/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  planId: z.enum(["starter", "pro", "agency"]),
  cadence: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();

  if (!isStripeConfigured()) {
    return Response.json({ error: "Ödeme henüz aktif değil." }, { status: 503 });
  }
  if (session.role !== "owner" && session.role !== "admin") {
    return Response.json({ error: "Bu işlem için yetkin yok." }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Geçersiz plan." }, { status: 400 });
  }

  if (!isPaidPlan(body.planId)) {
    return Response.json({ error: "Free plan için ödeme gerekmez." }, { status: 400 });
  }

  const priceId = priceIdFor(body.planId, body.cadence);
  if (!priceId) {
    return Response.json(
      { error: `Stripe fiyat tanımı eksik: ${body.planId}/${body.cadence}` },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const admin = getSupabaseAdmin();

  // Get-or-create Stripe Customer
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id, name")
    .eq("id", session.organizationId)
    .single();

  let customerId = (org?.stripe_customer_id ?? null) as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      name: org?.name ?? session.email,
      metadata: {
        organization_id: session.organizationId,
        user_id: session.userId,
      },
    });
    customerId = customer.id;
    await admin
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", session.organizationId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    client_reference_id: session.organizationId,
    subscription_data: {
      metadata: {
        organization_id: session.organizationId,
        plan_id: body.planId,
      },
    },
    locale: session.locale === "tr" ? "tr" : "en",
  });

  return Response.json({ url: checkout.url });
}
