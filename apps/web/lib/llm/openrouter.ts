import "server-only";
import OpenAI from "openai";
import type { ChatChunk, ChatOptions, EmbedOptions, LLMProvider } from "./provider";

/**
 * OpenRouter provider — uses OpenAI SDK with custom baseURL.
 * Supports any model OpenRouter exposes (gpt-4, claude, gemini, llama, etc.).
 * Embedding routed to OpenRouter's gateway.
 */
export function makeOpenRouterProvider(apiKey: string): LLMProvider {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://chativo.ai",
      "X-Title": "Chativo",
    },
  });

  return {
    name: "openrouter",

    async *chat(opts: ChatOptions): AsyncIterable<ChatChunk> {
      const stream = await client.chat.completions.create({
        model: opts.model ?? "openai/gpt-4o-mini",
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 800,
        stream: true,
      });
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;
        yield { delta: choice.delta.content ?? "", finishReason: choice.finish_reason ?? null };
      }
    },

    async embed(opts: EmbedOptions) {
      // OpenRouter supports OpenAI-format embeddings under /embeddings
      const res = await client.embeddings.create({
        model: opts.model ?? "openai/text-embedding-3-small",
        input: opts.texts,
      });
      return {
        embeddings: res.data.map((d) => d.embedding),
        tokenCount: res.usage?.total_tokens ?? 0,
      };
    },
  };
}
