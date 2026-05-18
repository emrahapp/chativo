import OpenAI from "openai";
import type {
  ChatChunk,
  ChatOptions,
  EmbedOptions,
  LLMProvider,
} from "./provider";

const DEFAULT_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
const DEFAULT_EMBED_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

let _client: OpenAI | null = null;
function client() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const openaiProvider: LLMProvider = {
  name: "openai",

  async *chat(opts: ChatOptions): AsyncIterable<ChatChunk> {
    const stream = await client().chat.completions.create({
      model: opts.model ?? DEFAULT_CHAT_MODEL,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 800,
      stream: true,
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;
      yield {
        delta: choice.delta.content ?? "",
        finishReason: choice.finish_reason ?? null,
      };
    }
  },

  async embed(opts: EmbedOptions) {
    const res = await client().embeddings.create({
      model: opts.model ?? DEFAULT_EMBED_MODEL,
      input: opts.texts,
    });
    return {
      embeddings: res.data.map((d) => d.embedding),
      tokenCount: res.usage?.total_tokens ?? 0,
    };
  },
};

export function getDefaultProvider(): LLMProvider {
  return openaiProvider;
}
