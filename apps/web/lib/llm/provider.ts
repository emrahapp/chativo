/**
 * LLM provider interface — abstract over OpenAI / OpenRouter / Anthropic.
 * Faz 1: only OpenAI implements this. Faz 2: drop in others without touching RAG pipeline.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

export interface ChatChunk {
  delta: string;
  finishReason?: "stop" | "length" | "content_filter" | null;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface EmbedOptions {
  texts: string[];
  model?: string;
}

export interface LLMProvider {
  readonly name: string;
  chat(opts: ChatOptions): AsyncIterable<ChatChunk>;
  embed(opts: EmbedOptions): Promise<{ embeddings: number[][]; tokenCount: number }>;
}
