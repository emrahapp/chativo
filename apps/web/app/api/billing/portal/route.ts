import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Redirects the user to the Stripe-hosted Customer Portal. */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!isStripeConfigured()) return new Response("stripe disabled", { status: 503 });
  if (session.role !== "owner" && session.role !== "admin") {
    return new Response("forbidden", { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", session.organizationId)
    .single();

  const customerId = (org?.stripe_customer_id ?? null) as string | null;
  if (!customerId) {
    return new Response("no_customer", { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
    locale: session.locale === "tr" ? "tr" : "en",
  });

  return Response.redirect(portal.url, 303);
}
