import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

export type WidgetAuthResult =
  | { ok: true; chatbot: ChatbotRecord }
  | { ok: false; status: 404 | 403 | 410; message: string };

/**
 * Loads a chatbot by ID and verifies it can be used from the given origin.
 * Service-role: bypasses RLS since widget endpoints are public.
 */
export async function loadWidgetChatbot(
  chatbotId: string,
  origin: string | null
): Promise<WidgetAuthResult> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("chatbots")
    .select("*")
    .eq("id", chatbotId)
    .maybeSingle();
  if (error || !data) return { ok: false, status: 404, message: "Chatbot not found" };

  const chatbot = data as unknown as ChatbotRecord;
  if (!chatbot.is_active) {
    return { ok: false, status: 410, message: "Chatbot is paused" };
  }

  // Domain allowlist (empty array = allow any origin — warn-only for MVP)
  const allow = chatbot.allowed_domains ?? [];
  if (allow.length > 0 && origin) {
    const host = safeHostFromOrigin(origin);
    if (host && !allow.some((d) => domainMatches(host, d))) {
      return { ok: false, status: 403, message: "Origin not allowed" };
    }
  }

  return { ok: true, chatbot };
}

function safeHostFromOrigin(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function domainMatches(host: string, allowed: string): boolean {
  const a = allowed.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
  if (a === host) return true;
  if (a.startsWith("*.") && host.endsWith(a.slice(1))) return true;
  // Bare apex (e.g. "example.com") also matches subdomains
  if (host.endsWith("." + a)) return true;
  return false;
}

export function corsHeaders(originHeader: string | null) {
  return {
    "Access-Control-Allow-Origin": originHeader ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
