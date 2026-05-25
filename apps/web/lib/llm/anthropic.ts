import "server-only";
import type { ChatChunk, ChatOptions, EmbedOptions, LLMProvider } from "./provider";

/**
 * Anthropic Claude provider (REST, no SDK).
 * Embedding not supported — falls back to OpenAI by caller convention.
 */
export function makeAnthropicProvider(apiKey: string): LLMProvider {
  const DEFAULT_MODEL = "claude-haiku-4-5";

  return {
    name: "anthropic",

    async *chat(opts: ChatOptions): AsyncIterable<ChatChunk> {
      const system = opts.messages.find((m) => m.role === "system")?.content ?? undefined;
      const messages = opts.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: opts.model ?? DEFAULT_MODEL,
          max_tokens: opts.maxTokens ?? 800,
          temperature: opts.temperature ?? 0.3,
          system,
          messages,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Anthropic chat ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { type: string; delta?: { text?: string; type?: string } };
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                yield { delta: parsed.delta.text };
              }
            } catch { /* skip */ }
          }
        }
      }
    },

    async embed(_opts: EmbedOptions) {
      throw new Error("Anthropic embed not supported — use OpenAI for embeddings.");
    },
  };
}
