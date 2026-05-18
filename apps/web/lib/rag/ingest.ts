import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { chunkText } from "./chunk";
import { embedTexts, embeddingToPgVector } from "./embed";
import { extractFromUrl, extractFromText, extractFromFaq } from "./extract";
import { extractFromFile } from "./extract-file";

interface IngestArgs {
  sourceId: string;
  chatbotId: string;
  organizationId: string;
  type: "website" | "manual" | "faq" | "pdf" | "docx" | "txt";
  payload:
    | { kind: "url"; url: string }
    | { kind: "text"; title: string; content: string }
    | { kind: "faq"; title: string; items: { question: string; answer: string }[] }
    | { kind: "file"; filename: string; mimeType: string; buffer: Buffer };
}

/**
 * Synchronous ingest: extract → chunk → embed → persist.
 *
 * MVP: runs inline in a server action. Large sources (>100k chars) should be
 * offloaded to BullMQ in Faz 2 — see lib/queue/. For now we cap content size.
 */
export async function ingestSource(args: IngestArgs): Promise<{ chunkCount: number; tokenCount: number }> {
  const admin = getSupabaseAdmin();   // we bypass RLS to update status + write chunks atomically

  // 1) Mark processing
  await admin
    .from("knowledge_sources")
    .update({ status: "processing", error_message: null })
    .eq("id", args.sourceId);

  try {
    // 2) Extract text
    const extracted = await runExtract(args.payload);

    if (!extracted.text || extracted.text.length < 20) {
      throw new Error("İçerik çok kısa (en az 20 karakter).");
    }

    // 3) Chunk
    const chunks = chunkText(extracted.text, {
      sourceTitle: extracted.title ?? "",
    });

    if (chunks.length === 0) {
      throw new Error("Parça çıkarılamadı.");
    }

    // 4) Embed (batched + retried)
    const { embeddings, totalTokens } = await embedTexts(chunks.map((c) => c.content));

    // 5) Replace existing chunks for this source (idempotent re-ingest)
    await admin.from("knowledge_chunks").delete().eq("source_id", args.sourceId);

    const rows = chunks.map((c, i) => ({
      chatbot_id: args.chatbotId,
      source_id: args.sourceId,
      organization_id: args.organizationId,
      content: c.content,
      embedding: embeddingToPgVector(embeddings[i]!),
      metadata: c.metadata ?? {},
      token_count: c.tokenCount,
    }));

    // Postgres has a parameter limit (~32k); chunk inserts in batches of 500
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await admin.from("knowledge_chunks").insert(rows.slice(i, i + 500));
      if (error) throw error;
    }

    // 6) Mark completed (don't overwrite title — it was set by the user at insert time)
    await admin
      .from("knowledge_sources")
      .update({
        status: "completed",
        chunk_count: chunks.length,
        raw_text: args.payload.kind === "text" ? args.payload.content : null,
        metadata: {
          extracted_byte_count: extracted.byteCount,
          extracted_title: extracted.title ?? null,
          embedding_tokens: totalTokens,
        },
      })
      .eq("id", args.sourceId);

    return { chunkCount: chunks.length, tokenCount: totalTokens };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("knowledge_sources")
      .update({ status: "failed", error_message: message.slice(0, 500) })
      .eq("id", args.sourceId);
    throw err;
  }
}

async function runExtract(p: IngestArgs["payload"]) {
  if (p.kind === "url") return extractFromUrl(p.url);
  if (p.kind === "text") return extractFromText(p.content, p.title);
  if (p.kind === "faq") return extractFromFaq(p.items, p.title);
  return extractFromFile({ filename: p.filename, mimeType: p.mimeType, buffer: p.buffer });
}
