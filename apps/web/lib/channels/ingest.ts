import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runRagChat } from "@/lib/llm/chat-rag";
import { incrementUsage, getUsageState } from "@/lib/usage/track";
import { dispatchEvent } from "@/lib/webhooks/dispatch";
import type { InboundMessage, ChannelAdapter, OutboundContext } from "./adapter";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

/**
 * Take an inbound message from any channel, find the right chatbot for the org,
 * run RAG, persist + reply via the channel adapter.
 *
 * The chatbot used is the FIRST active bot in the organization. Faz 2 ileri:
 * per-channel bot selection (organizations.channel_bot_map).
 */
export async function ingestChannelMessage(args: {
  organizationId: string;
  msg: InboundMessage;
  adapter: ChannelAdapter;
}): Promise<void> {
  const { organizationId, msg, adapter } = args;
  const admin = getSupabaseAdmin();

  // Plan limit first
  const usage = await getUsageState(organizationId);
  if (usage.exceeded) {
    await adapter.sendText(
      { channel: adapter.channel, externalConversationId: msg.externalConversationId, organizationId },
      "Üzgünüm, bu ayki mesaj limitime ulaştım. Yarın tekrar dene."
    );
    return;
  }

  // Pick first active bot for this org
  const { data: bot } = await admin
    .from("chatbots")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!bot) {
    await adapter.sendText(
      { channel: adapter.channel, externalConversationId: msg.externalConversationId, organizationId },
      "Bu hesap için aktif chatbot yapılandırılmamış."
    );
    return;
  }
  const chatbot = bot as unknown as ChatbotRecord;

  // Get-or-create conversation keyed by externalConversationId
  const visitorKey = msg.visitorId;
  let conversationId: string | null = null;
  {
    const { data: existing } = await admin
      .from("conversations")
      .select("id, ai_paused")
      .eq("chatbot_id", chatbot.id)
      .eq("visitor_id", visitorKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      conversationId = existing.id as string;
      if (existing.ai_paused) {
        // Human is handling — just log incoming, don't reply.
        await admin.from("messages").insert({
          conversation_id: conversationId,
          chatbot_id: chatbot.id,
          organization_id: organizationId,
          role: "user",
          content: msg.text,
        });
        return;
      }
    }
  }
  if (!conversationId) {
    const { data: created } = await admin
      .from("conversations")
      .insert({
        chatbot_id: chatbot.id,
        organization_id: organizationId,
        visitor_id: visitorKey,
        channel: adapter.channel,
      })
      .select("id")
      .single();
    conversationId = created!.id as string;

    // Fire webhook for new conversation
    void dispatchEvent({
      organizationId,
      eventType: "conversation.created",
      payload: {
        id: conversationId,
        chatbotId: chatbot.id,
        channel: adapter.channel,
        visitorId: visitorKey,
        visitorName: msg.visitorName ?? null,
      },
    });
  }

  // Persist user message
  await admin.from("messages").insert({
    conversation_id: conversationId,
    chatbot_id: chatbot.id,
    organization_id: organizationId,
    role: "user",
    content: msg.text,
  });

  // Load short history (last 10 turns)
  const { data: history } = await admin
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(11);              // last 11 includes the one we just inserted; we'll drop it for history
  const prior = (history ?? [])
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string }));

  // Run RAG, accumulate text
  let assistantText = "";
  for await (const event of runRagChat({
    chatbot,
    userMessage: msg.text,
    history: prior,
    locale: msg.locale,
  })) {
    if (event.type === "delta") assistantText += event.content;
    if (event.type === "error") {
      await adapter.sendText(
        { channel: adapter.channel, externalConversationId: msg.externalConversationId, organizationId },
        "Üzgünüm, bir hata oluştu. Birazdan tekrar dene."
      );
      return;
    }
  }
  if (!assistantText.trim()) {
    assistantText = "Üzgünüm, şu an cevap üretemedim.";
  }

  // Persist assistant message + usage
  await admin.from("messages").insert({
    conversation_id: conversationId,
    chatbot_id: chatbot.id,
    organization_id: organizationId,
    role: "assistant",
    content: assistantText,
  });
  await incrementUsage({
    organizationId,
    chatbotId: chatbot.id,
    messages: 1,
  });
  await admin.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  // Send back via channel
  await adapter.sendText(
    { channel: adapter.channel, externalConversationId: msg.externalConversationId, organizationId },
    assistantText
  );

  void dispatchEvent({
    organizationId,
    eventType: "message.received",
    payload: {
      conversationId,
      chatbotId: chatbot.id,
      channel: adapter.channel,
      userMessage: msg.text,
      assistantMessage: assistantText,
    },
  });
}
