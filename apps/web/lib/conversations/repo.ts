import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface ConversationListRow {
  id: string;
  visitor_id: string;
  channel: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  bot: { id: string; name: string } | null;
  lead: { id: string; name: string | null; email: string | null } | null;
  first_message: string | null;
  message_count: number;
}

/**
 * Lists conversations for an org.
 *
 * NOTE: we deliberately do NOT inline `lead:leads(...)` because conversations
 * and leads have two FK relationships (conversations.lead_id ↔ leads.id and
 * leads.conversation_id ↔ conversations.id), which PostgREST treats as
 * ambiguous and silently returns null. We fetch leads in a second pass.
 */
export async function listConversationsForOrg(
  organizationId: string,
  limit = 100
): Promise<ConversationListRow[]> {
  const supabase = await getSupabaseServer();

  const { data: convos, error } = await supabase
    .from("conversations")
    .select(`
      id, visitor_id, channel, rating, lead_id, created_at, updated_at,
      chatbot:chatbots(id, name),
      messages(id, content, role, created_at)
    `)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[conversations] list error:", error);
    return [];
  }

  // Dedupe by id — Supabase nested joins occasionally produce parent
  // duplicates when child tables have row-level chatter; safer to dedupe here
  // than to debug edge cases in the PostgREST aggregator.
  const seen = new Set<string>();
  const convoList = ((convos ?? []) as any[]).filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  if (convos && convos.length !== convoList.length) {
    console.warn(
      `[conversations] dropped ${convos.length - convoList.length} duplicate row(s) from PostgREST result`
    );
  }

  // Fetch leads in one round-trip
  const leadIds = convoList.map((c) => c.lead_id).filter(Boolean) as string[];
  let leadById = new Map<string, { id: string; name: string | null; email: string | null }>();
  if (leadIds.length > 0) {
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, name, email")
      .in("id", leadIds);
    if (leadsErr) console.error("[conversations] leads lookup error:", leadsErr);
    for (const l of leads ?? []) leadById.set(l.id, { id: l.id, name: l.name ?? null, email: l.email ?? null });
  }

  return convoList.map((c) => {
    const msgs = (c.messages ?? []) as Array<{ id: string; content: string; role: string; created_at: string }>;
    const firstUser = msgs
      .filter((m) => m.role === "user")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    return {
      id: c.id,
      visitor_id: c.visitor_id,
      channel: c.channel,
      rating: c.rating ?? null,
      created_at: c.created_at,
      updated_at: c.updated_at,
      bot: c.chatbot ? { id: c.chatbot.id, name: c.chatbot.name } : null,
      lead: c.lead_id ? leadById.get(c.lead_id) ?? null : null,
      first_message: firstUser?.content ?? null,
      message_count: msgs.length,
    };
  });
}

export interface ConversationDetail {
  id: string;
  visitor_id: string;
  channel: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  bot: { id: string; name: string; primary_color: string } | null;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    message: string | null;
  } | null;
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources_used: { id: string; source_id: string; preview: string; similarity: number }[];
    token_count: number | null;
    latency_ms: number | null;
    created_at: string;
  }[];
}

export async function getConversationDetail(id: string): Promise<ConversationDetail | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, visitor_id, channel, rating, lead_id, created_at, updated_at,
      chatbot:chatbots(id, name, primary_color),
      messages(id, role, content, sources_used, token_count, latency_ms, created_at)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[conversations] detail error:", error);
    return null;
  }
  if (!data) return null;

  const c = data as any;

  let lead: ConversationDetail["lead"] = null;
  if (c.lead_id) {
    const { data: leadRow } = await supabase
      .from("leads")
      .select("id, name, email, phone, company, message")
      .eq("id", c.lead_id)
      .maybeSingle();
    if (leadRow) {
      lead = {
        id: leadRow.id,
        name: leadRow.name ?? null,
        email: leadRow.email ?? null,
        phone: leadRow.phone ?? null,
        company: leadRow.company ?? null,
        message: leadRow.message ?? null,
      };
    }
  }

  return {
    id: c.id,
    visitor_id: c.visitor_id,
    channel: c.channel,
    rating: c.rating ?? null,
    created_at: c.created_at,
    updated_at: c.updated_at,
    bot: c.chatbot ? { id: c.chatbot.id, name: c.chatbot.name, primary_color: c.chatbot.primary_color } : null,
    lead,
    messages: ((c.messages ?? []) as ConversationDetail["messages"])
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

export function formatTimeAgoTr(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}
