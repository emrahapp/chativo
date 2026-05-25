import "server-only";
import type { ChannelAdapter, InboundMessage, OutboundContext } from "./adapter";
import { decrypt } from "@/lib/encryption";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const TG_API = "https://api.telegram.org";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name?: string; last_name?: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
}

export const telegramAdapter: ChannelAdapter & {
  parseInbound(update: TelegramUpdate): InboundMessage | null;
  setWebhook(token: string, webhookUrl: string, secret: string): Promise<void>;
  deleteWebhook(token: string): Promise<void>;
  getMe(token: string): Promise<{ id: number; username: string; first_name: string }>;
} = {
  channel: "telegram",

  parseInbound(update) {
    const m = update.message;
    if (!m || !m.text) return null;
    const name = [m.from.first_name, m.from.last_name].filter(Boolean).join(" ").trim() || m.from.username || `tg-${m.from.id}`;
    return {
      channel: "telegram",
      externalConversationId: String(m.chat.id),
      externalMessageId: String(m.message_id),
      visitorId: `telegram:${m.from.id}`,
      visitorName: name,
      text: m.text,
      receivedAt: new Date(m.date * 1000).toISOString(),
      raw: update,
    };
  },

  async sendText(ctx: OutboundContext, text: string) {
    const admin = getSupabaseAdmin();
    const { data: org } = await admin
      .from("organizations")
      .select("telegram_bot_token_encrypted")
      .eq("id", ctx.organizationId)
      .single();
    const enc = org?.telegram_bot_token_encrypted as string | null;
    if (!enc) throw new Error("Telegram token missing for organization");
    const token = decrypt(enc);

    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ctx.externalConversationId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Telegram sendMessage failed: ${res.status} ${body.slice(0, 200)}`);
    }
  },

  async setWebhook(token, webhookUrl, secret) {
    const res = await fetch(`${TG_API}/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !body.ok) throw new Error(body.description ?? `HTTP ${res.status}`);
  },

  async deleteWebhook(token) {
    await fetch(`${TG_API}/bot${token}/deleteWebhook`, { method: "POST" });
  },

  async getMe(token) {
    const res = await fetch(`${TG_API}/bot${token}/getMe`);
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: any; description?: string };
    if (!res.ok || !body.ok) throw new Error(body.description ?? `HTTP ${res.status}`);
    return body.result;
  },
};
