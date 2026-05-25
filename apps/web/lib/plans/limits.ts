import type { PlanId, PlanLimits } from "@chativo/shared";

/**
 * Static plan limits — mirrors the seed in `packages/db/migrations/0001_init.sql`.
 * Used for UI rendering without an extra DB hit. The DB is the source of truth
 * for enforcement (see lib/usage/check-limit.ts).
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyMessageLimit: 50,
    chatbotLimit: 1,
    sourceLimit: 10,           // demo / test için makul; production'da geri çekebiliriz
    fileSizeLimitMb: 25,
    teamMembersLimit: 1,
    removeBranding: false,
    whiteLabel: false,
  },
  starter: {
    monthlyMessageLimit: 1_000,
    chatbotLimit: 1,
    sourceLimit: 5,
    fileSizeLimitMb: 25,
    teamMembersLimit: 2,
    removeBranding: false,
    whiteLabel: false,
  },
  pro: {
    monthlyMessageLimit: 10_000,
    chatbotLimit: 5,
    sourceLimit: 25,
    fileSizeLimitMb: 50,
    teamMembersLimit: 5,
    removeBranding: true,
    whiteLabel: false,
  },
  agency: {
    monthlyMessageLimit: 50_000,
    chatbotLimit: 25,
    sourceLimit: 100,
    fileSizeLimitMb: 100,
    teamMembersLimit: 15,
    removeBranding: true,
    whiteLabel: true,
  },
};
