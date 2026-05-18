import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { embedTexts, embeddingToPgVector } from "./embed";

export interface RetrievedChunk {
  id: string;
  source_id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

interface RetrieveOptions {
  chatbotId: string;
  query: string;
  topK?: number;
  minSimilarity?: number;
}

/**
 * Retrieves the top-K most-similar knowledge chunks for a query.
 * Uses the `match_knowledge_chunks` Postgres RPC (cosine distance, IVFFlat-indexed).
 *
 * Runs as the service role so we can scope retrieval purely by chatbot_id — the
 * caller is trusted to have already authenticated and authorized the chatbot.
 */
export async function retrieveContext({
  chatbotId,
  query,
  topK = 6,
  minSimilarity = 0.0,
}: RetrieveOptions): Promise<{ chunks: RetrievedChunk[]; queryTokens: number }> {
  const trimmed = query.trim();
  if (!trimmed) return { chunks: [], queryTokens: 0 };

  // 1) Embed the query
  const { embeddings, totalTokens } = await embedTexts([trimmed]);
  const embedding = embeddings[0];
  if (!embedding) return { chunks: [], queryTokens: 0 };

  // 2) Cosine search via RPC
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("match_knowledge_chunks", {
    p_chatbot_id: chatbotId,
    p_query_embedding: embeddingToPgVector(embedding),
    p_match_count: topK,
    p_min_similarity: minSimilarity,
  });

  if (error || !data) return { chunks: [], queryTokens: totalTokens };

  return {
    chunks: (data as RetrievedChunk[]).map((c) => ({
      id: c.id,
      source_id: c.source_id,
      content: c.content,
      similarity: c.similarity,
      metadata: c.metadata ?? {},
    })),
    queryTokens: totalTokens,
  };
}

/** Concatenates retrieved chunks into a single context string with separators. */
export function formatContext(chunks: RetrievedChunk[], maxChars = 8000): string {
  let total = 0;
  const parts: string[] = [];
  for (const [i, c] of chunks.entries()) {
    const block = `[#${i + 1}] ${c.content.trim()}`;
    if (total + block.length > maxChars) break;
    parts.push(block);
    total += block.length;
  }
  return parts.join("\n\n---\n\n");
}
