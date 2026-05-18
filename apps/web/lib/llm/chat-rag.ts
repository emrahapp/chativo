import "server-only";
import { getDefaultProvider } from "./openai";
import { buildSystemPrompt, looksLikeInjection } from "./prompts";
import { retrieveContext, formatContext, type RetrievedChunk } from "@/lib/rag/retrieve";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RunRagChatArgs {
  chatbot: ChatbotRecord;
  userMessage: string;
  history?: ChatTurn[];        // prior turns in the same conversation
  locale?: "tr" | "en";
}

export type RagStreamEvent =
  | { type: "sources"; items: { id: string; source_id: string; preview: string; similarity: number }[] }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Streams a RAG-grounded chat response.
 *
 * Pipeline:
 *  1. Reject obvious prompt-injection attempts.
 *  2. Embed user message.
 *  3. Retrieve top-K chunks scoped to this chatbot.
 *  4. Build system prompt with retrieved context + bot config.
 *  5. Stream completion via the LLM provider.
 *
 * Yields events suitable for SSE forwarding to the browser.
 */
export async function* runRagChat({
  chatbot,
  userMessage,
  history = [],
  locale,
}: RunRagChatArgs): AsyncGenerator<RagStreamEvent> {
  try {
    // ── Guardrails ───────────────────────────────────────────────
    if (looksLikeInjection(userMessage)) {
      yield {
        type: "delta",
        content:
          locale === "en"
            ? "I can't follow instructions that override my settings. How can I help you with the original question?"
            : "Sistem ayarlarımı değiştiren talimatları uygulayamam. Asıl sorunuzla nasıl yardımcı olabilirim?",
      };
      yield { type: "done" };
      return;
    }

    // ── Retrieve ─────────────────────────────────────────────────
    const { chunks } = await retrieveContext({
      chatbotId: chatbot.id,
      query: userMessage,
      topK: 6,
      minSimilarity: 0,
    });

    yield {
      type: "sources",
      items: chunks.map((c) => ({
        id: c.id,
        source_id: c.source_id,
        preview: c.content.slice(0, 200),
        similarity: Number(c.similarity.toFixed(3)),
      })),
    };

    // ── Build prompt ─────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt({
      businessName: chatbot.business_name || chatbot.name,
      tone: chatbot.tone,
      answerLength: chatbot.answer_length,
      strictKnowledgeBase: chatbot.strict_knowledge_base,
      showLeadFormOnFallback: chatbot.show_lead_form_on_fallback,
      fallbackMessage: chatbot.fallback_message,
      locale: locale ?? (chatbot.language === "auto" ? "auto" : chatbot.language),
      knowledgeContext: formatContext(chunks),
    });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: userMessage },
    ];

    // ── Stream ───────────────────────────────────────────────────
    const provider = getDefaultProvider();
    for await (const chunk of provider.chat({
      messages,
      temperature: 0.3,
      maxTokens: tokensFor(chatbot.answer_length),
    })) {
      if (chunk.delta) yield { type: "delta", content: chunk.delta };
    }

    yield { type: "done" };
  } catch (err) {
    const message = humanizeError(err);
    yield { type: "error", message };
  }
}

function tokensFor(length: ChatbotRecord["answer_length"]): number {
  if (length === "short") return 200;
  if (length === "detailed") return 1200;
  return 600;
}

function humanizeError(err: unknown): string {
  const e = err as { status?: number; message?: string };
  if (e.status === 401) return "OpenAI API anahtarı geçersiz.";
  if (e.status === 429) return "OpenAI bakiyeniz yetersiz veya rate limit aşıldı.";
  if (e.status && e.status >= 500) return "Model sağlayıcısında geçici bir sorun var. Birazdan tekrar dene.";
  return e.message ?? "Beklenmeyen bir hata oluştu.";
}

/** Lightweight summary of which sources were retrieved — for logging / UI. */
export function summarizeSources(chunks: RetrievedChunk[]) {
  return chunks.map((c) => ({
    chunkId: c.id,
    sourceId: c.source_id,
    similarity: c.similarity,
  }));
}
