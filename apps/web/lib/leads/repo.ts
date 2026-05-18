import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  created_at: string;
  conversation_id: string | null;
  bot: { id: string; name: string } | null;
}

export async function listLeadsForOrg(organizationId: string, limit = 200): Promise<LeadRow[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("leads")
    .select(`
      id, name, email, phone, company, message, created_at, conversation_id,
      chatbot:chatbots(id, name)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    company: r.company ?? null,
    message: r.message ?? null,
    created_at: r.created_at,
    conversation_id: r.conversation_id ?? null,
    bot: r.chatbot ? { id: r.chatbot.id, name: r.chatbot.name } : null,
  }));
}
