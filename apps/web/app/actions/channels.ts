"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { telegramAdapter } from "@/lib/channels/telegram";
import { encrypt } from "@/lib/encryption";

export type ChannelFormState = { ok: boolean; error?: string; info?: string };

// ──────────────────────────────────────────────────────────────────
// Telegram
// ──────────────────────────────────────────────────────────────────
const TgConnectSchema = z.object({
  token: z.string().min(20, "Token çok kısa").max(200, "Token çok uzun"),
});

export async function connectTelegramAction(
  _prev: ChannelFormState | null,
  fd: FormData
): Promise<ChannelFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  const parsed = TgConnectSchema.safeParse({ token: fd.get("token") });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz token" };

  // Validate by calling /getMe
  let username: string;
  try {
    const me = await telegramAdapter.getMe(parsed.data.token);
    username = me.username;
  } catch (err) {
    return { ok: false, error: `Telegram token doğrulanamadı: ${err instanceof Error ? err.message : "hata"}` };
  }

  // Set webhook
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/telegram/webhook/${session.organizationId}`;
  try {
    await telegramAdapter.setWebhook(parsed.data.token, webhookUrl, session.organizationId);
  } catch (err) {
    return { ok: false, error: `Webhook kurulamadı: ${err instanceof Error ? err.message : "hata"}` };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organizations")
    .update({
      telegram_bot_token_encrypted: encrypt(parsed.data.token),
      telegram_bot_username: username,
    })
    .eq("id", session.organizationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, info: `Telegram bot @${username} bağlandı.` };
}

export async function disconnectTelegramAction(): Promise<ChannelFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("telegram_bot_token_encrypted")
    .eq("id", session.organizationId)
    .single();
  if (org?.telegram_bot_token_encrypted) {
    try {
      const { decrypt } = await import("@/lib/encryption");
      const token = decrypt(org.telegram_bot_token_encrypted as string);
      await telegramAdapter.deleteWebhook(token);
    } catch { /* best-effort */ }
  }

  await admin
    .from("organizations")
    .update({ telegram_bot_token_encrypted: null, telegram_bot_username: null })
    .eq("id", session.organizationId);
  revalidatePath("/settings");
  return { ok: true, info: "Telegram bot bağlantısı kaldırıldı." };
}

// ──────────────────────────────────────────────────────────────────
// WhatsApp Cloud API
// ──────────────────────────────────────────────────────────────────
const WaConnectSchema = z.object({
  phoneId: z.string().min(5).max(100),
  token: z.string().min(20).max(500),
  verifyToken: z.string().min(8).max(100),
});

export async function connectWhatsAppAction(
  _prev: ChannelFormState | null,
  fd: FormData
): Promise<ChannelFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  const parsed = WaConnectSchema.safeParse({
    phoneId: fd.get("phoneId"),
    token: fd.get("token"),
    verifyToken: fd.get("verifyToken"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz" };

  // Optionally validate token with Meta — skipping to avoid roundtrip; if creds are wrong, sending will fail later.

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organizations")
    .update({
      whatsapp_phone_id: parsed.data.phoneId,
      whatsapp_token_encrypted: encrypt(parsed.data.token),
      whatsapp_verify_token: parsed.data.verifyToken,
    })
    .eq("id", session.organizationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, info: "WhatsApp Cloud API bağlandı. Webhook URL'sini Meta panelinden onayla." };
}

export async function disconnectWhatsAppAction(): Promise<ChannelFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  const admin = getSupabaseAdmin();
  await admin
    .from("organizations")
    .update({
      whatsapp_phone_id: null,
      whatsapp_token_encrypted: null,
      whatsapp_verify_token: null,
    })
    .eq("id", session.organizationId);
  revalidatePath("/settings");
  return { ok: true, info: "WhatsApp bağlantısı kaldırıldı." };
}
