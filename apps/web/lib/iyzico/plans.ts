import type { PlanId } from "@chativo/shared";

/**
 * TRY pricing — mirrors Stripe but in Turkish Lira.
 * iyzico tek seferlik ödeme yapar; subscription için tekrar tekrar form göndermek lazım
 * VEYA iyzico'nun subscription product'larını kullanmak gerek. MVP'de bir aylık ödeme.
 */

export interface IyzicoPlan {
  planId: Exclude<PlanId, "free">;
  cadence: "monthly" | "yearly";
  priceTry: string;
  label: string;
}

const RAW: IyzicoPlan[] = [
  { planId: "starter", cadence: "monthly", priceTry: "499.00",  label: "Starter — Aylık" },
  { planId: "starter", cadence: "yearly",  priceTry: "4990.00", label: "Starter — Yıllık" },
  { planId: "pro",     cadence: "monthly", priceTry: "1299.00", label: "Pro — Aylık" },
  { planId: "pro",     cadence: "yearly",  priceTry: "12990.00",label: "Pro — Yıllık" },
  { planId: "agency",  cadence: "monthly", priceTry: "3999.00", label: "Agency — Aylık" },
  { planId: "agency",  cadence: "yearly",  priceTry: "39990.00",label: "Agency — Yıllık" },
];

export function getIyzicoPlan(planId: PlanId, cadence: "monthly" | "yearly"): IyzicoPlan | null {
  if (planId === "free") return null;
  return RAW.find((p) => p.planId === planId && p.cadence === cadence) ?? null;
}

export const IYZICO_PLANS = RAW;
