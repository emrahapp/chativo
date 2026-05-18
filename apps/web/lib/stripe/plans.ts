import type { PlanId } from "@chativo/shared";

/**
 * Stripe Price IDs come from env vars (set them in Vercel + .env.local).
 * One price per plan + cadence. Free has no Stripe price.
 *
 * Example:
 *   STRIPE_PRICE_STARTER_MONTHLY=price_1Abc...
 *   STRIPE_PRICE_STARTER_YEARLY=price_1Def...
 */

export type Cadence = "monthly" | "yearly";

export function priceIdFor(planId: Exclude<PlanId, "free">, cadence: Cadence): string | null {
  const envKey = `STRIPE_PRICE_${planId.toUpperCase()}_${cadence.toUpperCase()}`;
  return process.env[envKey] ?? null;
}

/** Reverse lookup: given a Stripe price id, find which plan it represents. */
export function planFromPriceId(priceId: string): { planId: PlanId; cadence: Cadence } | null {
  const plans: Exclude<PlanId, "free">[] = ["starter", "pro", "agency"];
  const cadences: Cadence[] = ["monthly", "yearly"];
  for (const p of plans) {
    for (const c of cadences) {
      if (priceIdFor(p, c) === priceId) return { planId: p, cadence: c };
    }
  }
  return null;
}

export function isPaidPlan(planId: PlanId): planId is Exclude<PlanId, "free"> {
  return planId !== "free";
}
