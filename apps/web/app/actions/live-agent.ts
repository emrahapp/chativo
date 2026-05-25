"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

export type AgentState = { ok: boolean; error?: string };

/** Take over a conversation: pause AI, assign to current user. */
export async function takeOverConversationAction(conversationId: string): Promise<AgentState> {
  const session = await requireSession();
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("conversations")
    .update({
      ai_paused: true,
      assigned_user_id: session.userId,
      handed_over_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath("/conversations");
  return { ok: true };
}

/** Return conversation to AI. */
export async function releaseConversationAction(conversationId: string): Promise<AgentState> {
  await requireSession();
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("conversations")
    .update({
      ai_paused: false,
      assigned_user_id: null,
    })
    .eq("id", conversationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/conversations/${conversationId}`);
  return { ok: true };
}

/** Add an internal note (agent-only). */
export async function addConversationNoteAction(conversationId: string, body: string): Promise<AgentState> {
  const session = await requireSession();
  if (!body.trim()) return { ok: false, error: "Boş not" };
  const supabase = await getSupabaseServer();

  // Fetch org id for the conversation (defensive; RLS would catch)
  const { data: convo } = await supabase
    .from("conversations")
    .select("organization_id")
    .eq("id", conversationId)
    .single();
  if (!convo) return { ok: false, error: "Konuşma bulunamadı" };

  const { error } = await supabase.from("conversation_notes").insert({
    conversation_id: conversationId,
    organization_id: convo.organization_id,
    author_id: session.userId,
    body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/conversations/${conversationId}`);
  return { ok: true };
}

/** Send a manual agent reply (acts as assistant role in chat history). */
export async function sendAgentReplyAction(conversationId: string, text: string): Promise<AgentState> {
  await requireSession();
  if (!text.trim()) return { ok: false, error: "Boş mesaj" };
  const admin = getSupabaseAdmin();

  const { data: convo } = await admin
    .from("conversations")
    .select("id, chatbot_id, organization_id, channel, visitor_id")
    .eq("id", conversationId)
    .single();
  if (!convo) return { ok: false, error: "Konuşma bulunamadı" };

  // Persist as assistant message (human-sent)
  await admin.from("messages").insert({
    conversation_id: convo.id,
    chatbot_id: convo.chatbot_id,
    organization_id: convo.organization_id,
    role: "assistant",
    content: text.trim(),
  });
  await admin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convo.id);

  // Channel send-out
  try {
    if (convo.channel === "telegram") {
      const { telegramAdapter } = await import("@/lib/channels/telegram");
      // visitor_id format: "telegram:<chat_id>" → strip prefix
      const externalId = String(convo.visitor_id).replace(/^telegram:/, "");
      await telegramAdapter.sendText(
        { channel: "telegram", externalConversationId: externalId, organizationId: convo.organization_id as string },
        text.trim()
      );
    } else if (convo.channel === "whatsapp") {
      const { whatsappAdapter } = await import("@/lib/channels/whatsapp");
      const externalId = String(convo.visitor_id).replace(/^whatsapp:/, "");
      await whatsappAdapter.sendText(
        { channel: "whatsapp", externalConversationId: externalId, organizationId: convo.organization_id as string },
        text.trim()
      );
    }
    // For 'web' channel, the next time the visitor's widget polls/reconnects they'll see it.
  } catch (err) {
    console.error("[agent send-out]", err);
    // Message stored, just channel delivery failed
  }

  revalidatePath(`/conversations/${conversationId}`);
  return { ok: true };
}
