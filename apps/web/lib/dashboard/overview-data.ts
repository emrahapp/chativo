import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface OverviewSnapshot {
  totalChatbots: number;
  monthlyMessages: number;
  totalConversations: number;
  totalLeads: number;
  recentConversations: Array<{
    id: string;
    botName: string;
    firstMessage: string;
    createdAt: string;
  }>;
  activeBots: Array<{
    id: string;
    name: string;
    isActive: boolean;
    sourceCount: number;
  }>;
  setupProgress: { total: number; completed: number };
}

const startOfMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

export async function getOverviewSnapshot(organizationId: string): Promise<OverviewSnapshot> {
  const supabase = await getSupabaseServer();

  const [
    { count: totalChatbots },
    { count: totalConversations },
    { count: totalLeads },
    { data: usageRows },
    { data: recentMsgs },
    { data: bots },
  ] = await Promise.all([
    supabase.from("chatbots").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("conversations").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("leads").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("usage_logs").select("message_count")
      .eq("organization_id", organizationId)
      .gte("date", startOfMonth().slice(0, 10)),
    supabase
      .from("messages")
      .select("id, content, created_at, conversation_id, chatbot:chatbots(name)")
      .eq("organization_id", organizationId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("chatbots")
      .select("id, name, is_active, sources:knowledge_sources(count)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthlyMessages = (usageRows ?? []).reduce((acc, r) => acc + (r.message_count ?? 0), 0);

  // One row PER CONVERSATION (not per user message) — keep the most recent
  // user message for each conversation as the preview.
  const recentConversations: Array<{
    id: string;             // message id, used as React key
    conversationId: string; // link target
    botName: string;
    firstMessage: string;
    createdAt: string;
  }> = [];
  {
    const seen = new Set<string>();
    for (const m of (recentMsgs ?? [])) {
      const convoId = m.conversation_id as string;
      if (seen.has(convoId)) continue;
      seen.add(convoId);
      recentConversations.push({
        id: m.id as string,
        conversationId: convoId,
        botName: ((m.chatbot as unknown as { name: string } | null)?.name ?? "—"),
        firstMessage: m.content as string,
        createdAt: m.created_at as string,
      });
    }
  }

  const activeBots =
    (bots ?? []).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      isActive: b.is_active as boolean,
      sourceCount: ((b.sources as unknown as Array<{ count: number }> | null)?.[0]?.count) ?? 0,
    }));

  const setupCompleted = activeBots.filter((b) => b.sourceCount > 0).length;
  return {
    totalChatbots: totalChatbots ?? 0,
    monthlyMessages,
    totalConversations: totalConversations ?? 0,
    totalLeads: totalLeads ?? 0,
    recentConversations,
    activeBots,
    setupProgress: { total: activeBots.length, completed: setupCompleted },
  };
}
