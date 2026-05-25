import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { openaiProvider } from "./openai";
import { makeAnthropicProvider } from "./anthropic";
import { makeOpenRouterProvider } from "./openrouter";
import { decrypt } from "@/lib/encryption";
import type { LLMProvider } from "./provider";

interface SelectArgs {
  organizationId: string;
  modelProvider?: "openai" | "anthropic" | "openrouter" | "gemini" | null;
}

/**
 * Returns the LLM provider for the given bot/org based on:
 *  1. Bot's `model_provider` column
 *  2. Org's BYOK keys (encrypted)
 *  3. Fallback to default OpenAI (system key)
 */
export async function selectProvider({ organizationId, modelProvider }: SelectArgs): Promise<LLMProvider> {
  const provider = modelProvider ?? "openai";

  if (provider === "openai") {
    // Org may BYOK their own OpenAI key — for now we always use system key.
    // Future: check organizations.byok_openai_key_encrypted
    return openaiProvider;
  }

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("byok_anthropic_key_encrypted, byok_openrouter_key_encrypted")
    .eq("id", organizationId)
    .single();

  if (provider === "anthropic") {
    const enc = org?.byok_anthropic_key_encrypted as string | null;
    if (!enc) throw new Error("Anthropic için BYOK key gerekli. Settings → BYOK'tan ekle.");
    return makeAnthropicProvider(decrypt(enc));
  }

  if (provider === "openrouter") {
    const enc = org?.byok_openrouter_key_encrypted as string | null;
    if (!enc) throw new Error("OpenRouter için BYOK key gerekli.");
    return makeOpenRouterProvider(decrypt(enc));
  }

  // Gemini scaffolded — falls back to OpenAI for now
  return openaiProvider;
}
