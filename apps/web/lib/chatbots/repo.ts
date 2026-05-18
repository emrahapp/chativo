import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface ChatbotRecord {
  id: string;
  organization_id: string;
  name: string;
  business_name: string | null;
  language: "tr" | "en" | "auto";
  purpose: string;
  tone: "professional" | "friendly" | "concise" | "sales";
  answer_length: "short" | "normal" | "detailed";
  welcome_message: string | null;
  fallback_message: string | null;
  primary_color: string;
  logo_url: string | null;
  avatar_url: string | null;
  widget_position: "bottom-right" | "bottom-left";
  theme: "light" | "dark" | "system";
  quick_questions: { label: string }[];
  is_active: boolean;
  allowed_domains: string[];
  strict_knowledge_base: boolean;
  show_lead_form_on_fallback: boolean;
  created_at: string;
  updated_at: string;
}

/** Loads a chatbot scoped to the current user's organization (RLS). */
export async function getChatbot(id: string): Promise<ChatbotRecord | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ChatbotRecord;
}

export async function listChatbots(organizationId: string) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("chatbots")
    .select("*, sources:knowledge_sources(count)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function countSources(chatbotId: string) {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("knowledge_sources")
    .select("id", { count: "exact", head: true })
    .eq("chatbot_id", chatbotId);
  return count ?? 0;
}
