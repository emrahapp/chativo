import "server-only";

/**
 * Channel adapter interface — unifies how inbound messages from different
 * platforms (web widget, Telegram, WhatsApp, Slack) get routed into the
 * existing RAG pipeline + how replies get sent back out.
 *
 * Each channel implements `parseInbound` (their webhook payload → normalized
 * Inbound) and `sendOutbound` (assistant reply → their API call).
 */

export type ChannelKind = "web" | "telegram" | "whatsapp" | "slack";

export interface InboundMessage {
  channel: ChannelKind;
  externalConversationId: string;       // e.g. telegram chat_id, whatsapp wa_id
  externalMessageId?: string;
  visitorId: string;                    // stable per-channel user identifier
  visitorName?: string;
  text: string;
  locale?: "tr" | "en";
  receivedAt: string;
  raw: unknown;
}

export interface OutboundContext {
  channel: ChannelKind;
  externalConversationId: string;
  organizationId: string;
}

/**
 * Each channel needs at minimum a way to send a text reply back.
 * Future: send buttons, lead forms, file attachments.
 */
export interface ChannelAdapter {
  readonly channel: ChannelKind;
  sendText(ctx: OutboundContext, text: string): Promise<void>;
}

/**
 * Map external conversation id → existing conversations row.
 * Stored in conversations.visitor_id as `<channel>:<external_id>` so the
 * web widget's UUID visitor_id stays untouched.
 */
export function formatVisitorId(channel: ChannelKind, externalId: string): string {
  if (channel === "web") return externalId;
  return `${channel}:${externalId}`;
}
