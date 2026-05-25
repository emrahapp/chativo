import "server-only";
import type { ChannelAdapter, InboundMessage, OutboundContext } from "./adapter";
import { decrypt } from "@/lib/encryption";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const META_API = "https://graph.facebook.com/v21.0";

interface WhatsAppEntry {
  changes: Array<{
    value: {
      metadata: { phone_number_id: string };
      contacts?: Array<{ profile?: { name?: string }; wa_id: string }>;
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
      }>;
    };
  }>;
}

interface WhatsAppWebhookBody {
  object: string;
  entry: WhatsAppEntry[];
}

export const whatsappAdapter: ChannelAdapter & {
  parseInbound(body: WhatsAppWebhookBody): { messages: InboundMessage[]; phoneId: string | null };
} = {
  channel: "whatsapp",

  parseInbound(body) {
    const out: InboundMessage[] = [];
    let phoneId: string | null = null;
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const v = change.value;
        if (!v?.messages) continue;
        phoneId = v.metadata?.phone_number_id ?? phoneId;
        for (const m of v.messages) {
          if (m.type !== "text" || !m.text?.body) continue;
          const contact = v.contacts?.find((c) => c.wa_id === m.from);
          out.push({
            channel: "whatsapp",
            externalConversationId: m.from,             // WhatsApp uses the user's wa_id as chat id
            externalMessageId: m.id,
            visitorId: `whatsapp:${m.from}`,
            visitorName: contact?.profile?.name ?? `wa-${m.from}`,
            text: m.text.body,
            receivedAt: new Date(parseInt(m.timestamp, 10) * 1000).toISOString(),
            raw: m,
          });
        }
      }
    }
    return { messages: out, phoneId };
  },

  async sendText(ctx: OutboundContext, text: string) {
    const admin = getSupabaseAdmin();
    const { data: org } = await admin
      .from("organizations")
      .select("whatsapp_token_encrypted, whatsapp_phone_id")
      .eq("id", ctx.organizationId)
      .single();
    const enc = org?.whatsapp_token_encrypted as string | null;
    const phoneId = org?.whatsapp_phone_id as string | null;
    if (!enc || !phoneId) throw new Error("WhatsApp credentials missing for organization");
    const token = decrypt(enc);

    const res = await fetch(`${META_API}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: ctx.externalConversationId,
        type: "text",
        text: { body: text },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`WhatsApp send failed: ${res.status} ${body.slice(0, 300)}`);
    }
  },
};
