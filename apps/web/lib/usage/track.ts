import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plans/limits";

export interface UsageState {
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
}

/** Returns this calendar month's message usage and the plan limit. */
export async function getUsageState(organizationId: string): Promise<UsageState> {
  const admin = getSupabaseAdmin();

  const { data: org } = await admin
    .from("organizations")
    .select("plan_id")
    .eq("id", organizationId)
    .single();

  const planId = (org?.plan_id ?? "free") as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planId].monthlyMessageLimit;

  const { data: rows } = await admin
    .from("usage_logs")
    .select("message_count")
    .eq("organization_id", organizationId)
    .gte("date", startOfMonth());

  const used = (rows ?? []).reduce((a, r) => a + (r.message_count ?? 0), 0);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
  };
}

/**
 * Increments today's usage row for an organization+chatbot.
 * Upsert on (organization_id, chatbot_id, date) unique constraint.
 */
export async function incrementUsage(args: {
  organizationId: string;
  chatbotId: string;
  messages?: number;
  tokens?: number;
  embeddingTokens?: number;
}) {
  const admin = getSupabaseAdmin();
  const today = startOfDay();

  const { data: existing } = await admin
    .from("usage_logs")
    .select("id, message_count, token_count, embedding_token_count")
    .eq("organization_id", args.organizationId)
    .eq("chatbot_id", args.chatbotId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    await admin
      .from("usage_logs")
      .update({
        message_count: (existing.message_count ?? 0) + (args.messages ?? 0),
        token_count: (existing.token_count ?? 0) + (args.tokens ?? 0),
        embedding_token_count: (existing.embedding_token_count ?? 0) + (args.embeddingTokens ?? 0),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("usage_logs").insert({
      organization_id: args.organizationId,
      chatbot_id: args.chatbotId,
      date: today,
      message_count: args.messages ?? 0,
      token_count: args.tokens ?? 0,
      embedding_token_count: args.embeddingTokens ?? 0,
    });
  }
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function startOfDay(): string {
  return new Date().toISOString().slice(0, 10);
}
