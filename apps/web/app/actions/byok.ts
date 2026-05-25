"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export type ByokFormState = { ok: boolean; error?: string; info?: string };
export type Provider = "anthropic" | "openrouter";

export async function setByokKeyAction(provider: Provider, key: string): Promise<ByokFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  if (!key || key.length < 16) return { ok: false, error: "Geçersiz key" };

  const admin = getSupabaseAdmin();
  const column =
    provider === "anthropic"
      ? "byok_anthropic_key_encrypted"
      : "byok_openrouter_key_encrypted";

  const { error } = await admin
    .from("organizations")
    .update({ [column]: encrypt(key) })
    .eq("id", session.organizationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, info: `${provider} key kaydedildi (şifreli).` };
}

export async function removeByokKeyAction(provider: Provider): Promise<ByokFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  const admin = getSupabaseAdmin();
  const column =
    provider === "anthropic"
      ? "byok_anthropic_key_encrypted"
      : "byok_openrouter_key_encrypted";
  await admin
    .from("organizations")
    .update({ [column]: null })
    .eq("id", session.organizationId);
  revalidatePath("/settings");
  return { ok: true, info: `${provider} key silindi.` };
}
