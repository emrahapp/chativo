import "server-only";
import { getDefaultProvider } from "@/lib/llm/openai";

const BATCH_SIZE = 100;          // OpenAI accepts up to 2048 but 100 is safe + fast
const RETRY_MS = [500, 1500, 3500];

/**
 * Embeds an array of strings via the default LLM provider, batched + retried.
 * Returns embeddings in the same order as the input, along with total tokens used.
 */
export async function embedTexts(texts: string[]): Promise<{
  embeddings: number[][];
  totalTokens: number;
}> {
  if (texts.length === 0) return { embeddings: [], totalTokens: 0 };

  const provider = getDefaultProvider();
  const all: number[][] = [];
  let totalTokens = 0;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings, tokenCount } = await withRetry(() => provider.embed({ texts: batch }));
    all.push(...embeddings);
    totalTokens += tokenCount;
  }

  return { embeddings: all, totalTokens };
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_MS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === RETRY_MS.length) break;
      await new Promise((r) => setTimeout(r, RETRY_MS[attempt]));
    }
  }
  throw lastErr;
}

function isTransient(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  if (e.status === 429 || (e.status && e.status >= 500)) return true;
  if (e.code === "ETIMEDOUT" || e.code === "ECONNRESET") return true;
  return false;
}

/** Postgres pgvector wants the literal `'[1.0, 2.0, ...]'` string format. */
export function embeddingToPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
