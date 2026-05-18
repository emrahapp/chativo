import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface AnalyticsSnapshot {
  totals: {
    messages: number;
    conversations: number;
    leads: number;
    leadRate: number;     // leads / conversations
  };
  dailyMessages: { date: string; count: number }[];          // last 30 days
  perBot: { bot: string; messages: number; conversations: number }[];
  ratings: { positive: number; negative: number; none: number };
}

const RANGE_DAYS = 30;

export async function getAnalyticsSnapshot(organizationId: string): Promise<AnalyticsSnapshot> {
  const supabase = await getSupabaseServer();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (RANGE_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();
  const sinceDate = sinceIso.slice(0, 10);

  const [
    { data: usage },
    { count: totalConversations },
    { count: totalLeads },
    { data: ratings },
    { data: botRows },
  ] = await Promise.all([
    supabase
      .from("usage_logs")
      .select("date, message_count, chatbot_id")
      .eq("organization_id", organizationId)
      .gte("date", sinceDate),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", sinceIso),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", sinceIso),
    supabase
      .from("conversations")
      .select("rating")
      .eq("organization_id", organizationId),
    supabase
      .from("chatbots")
      .select("id, name")
      .eq("organization_id", organizationId),
  ]);

  // ── Daily messages (fill missing days with 0)
  const usageByDate = new Map<string, number>();
  for (const u of usage ?? []) {
    usageByDate.set(u.date as string, (usageByDate.get(u.date as string) ?? 0) + (u.message_count ?? 0));
  }
  const dailyMessages: { date: string; count: number }[] = [];
  for (let i = 0; i < RANGE_DAYS; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    dailyMessages.push({ date: iso, count: usageByDate.get(iso) ?? 0 });
  }
  const totalMessages = dailyMessages.reduce((a, b) => a + b.count, 0);

  // ── Per-bot
  const botNameById = new Map<string, string>();
  for (const b of botRows ?? []) botNameById.set(b.id as string, b.name as string);
  const messagesByBot = new Map<string, number>();
  for (const u of usage ?? []) {
    const bid = u.chatbot_id as string | null;
    if (!bid) continue;
    messagesByBot.set(bid, (messagesByBot.get(bid) ?? 0) + (u.message_count ?? 0));
  }
  const { data: convoCounts } = await supabase
    .from("conversations")
    .select("chatbot_id")
    .eq("organization_id", organizationId)
    .gte("created_at", sinceIso);
  const convosByBot = new Map<string, number>();
  for (const r of convoCounts ?? []) {
    const bid = r.chatbot_id as string;
    convosByBot.set(bid, (convosByBot.get(bid) ?? 0) + 1);
  }
  const perBot = Array.from(botNameById.entries())
    .map(([id, name]) => ({
      bot: name,
      messages: messagesByBot.get(id) ?? 0,
      conversations: convosByBot.get(id) ?? 0,
    }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 8);

  // ── Ratings
  let positive = 0, negative = 0, none = 0;
  for (const r of ratings ?? []) {
    if (r.rating === 1) positive++;
    else if (r.rating === -1) negative++;
    else none++;
  }

  const totalConvos = totalConversations ?? 0;
  const totalLd = totalLeads ?? 0;

  return {
    totals: {
      messages: totalMessages,
      conversations: totalConvos,
      leads: totalLd,
      leadRate: totalConvos > 0 ? totalLd / totalConvos : 0,
    },
    dailyMessages,
    perBot,
    ratings: { positive, negative, none },
  };
}

// formatDateShort lives in ./format.ts so client charts can import it
// without pulling in "server-only".
