"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { ingestSource } from "@/lib/rag/ingest";
import { PLAN_LIMITS } from "@/lib/plans/limits";

export type SourceFormState = {
  ok: boolean;
  error?: string;
  info?: string;
};

// ─────────────────────────────────────────────────────────────────────
// URL source
// ─────────────────────────────────────────────────────────────────────
const UrlSchema = z.object({
  chatbotId: z.string().uuid(),
  url: z.string().min(4).max(500),
  title: z.string().max(200).optional(),
});

export async function createUrlSourceAction(_prev: SourceFormState | null, fd: FormData): Promise<SourceFormState> {
  const session = await requireSession();
  const parsed = UrlSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    url: fd.get("url"),
    title: fd.get("title") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz URL" };

  const limitCheck = await assertSourceLimit(session.organizationId, session.planId);
  if (limitCheck) return limitCheck;

  const supabase = await getSupabaseServer();
  const display = parsed.data.title ?? cleanUrlForTitle(parsed.data.url);

  const { data: source, error } = await supabase
    .from("knowledge_sources")
    .insert({
      chatbot_id: parsed.data.chatbotId,
      organization_id: session.organizationId,
      type: "website",
      title: display,
      source_url: parsed.data.url,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !source) return { ok: false, error: error?.message ?? "Kaynak eklenemedi" };

  try {
    await ingestSource({
      sourceId: source.id,
      chatbotId: parsed.data.chatbotId,
      organizationId: session.organizationId,
      type: "website",
      payload: { kind: "url", url: parsed.data.url },
    });
  } catch (err) {
    revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
    revalidatePath("/knowledge");
    return { ok: false, error: err instanceof Error ? err.message : "Tarama başarısız" };
  }

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  revalidatePath("/knowledge");
  return { ok: true, info: "URL başarıyla eğitildi." };
}

// ─────────────────────────────────────────────────────────────────────
// Manual text source
// ─────────────────────────────────────────────────────────────────────
const ManualSchema = z.object({
  chatbotId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(20).max(100_000),
});

export async function createManualSourceAction(_prev: SourceFormState | null, fd: FormData): Promise<SourceFormState> {
  const session = await requireSession();
  const parsed = ManualSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    title: fd.get("title"),
    content: fd.get("content"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz içerik" };

  const limitCheck = await assertSourceLimit(session.organizationId, session.planId);
  if (limitCheck) return limitCheck;

  const supabase = await getSupabaseServer();
  const { data: source, error } = await supabase
    .from("knowledge_sources")
    .insert({
      chatbot_id: parsed.data.chatbotId,
      organization_id: session.organizationId,
      type: "manual",
      title: parsed.data.title,
      status: "pending",
    })
    .select("id")
    .single();
  if (error || !source) return { ok: false, error: error?.message ?? "Kaynak eklenemedi" };

  try {
    await ingestSource({
      sourceId: source.id,
      chatbotId: parsed.data.chatbotId,
      organizationId: session.organizationId,
      type: "manual",
      payload: { kind: "text", title: parsed.data.title, content: parsed.data.content },
    });
  } catch (err) {
    revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
    return { ok: false, error: err instanceof Error ? err.message : "İşleme başarısız" };
  }

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  revalidatePath("/knowledge");
  return { ok: true, info: "Metin başarıyla eğitildi." };
}

// ─────────────────────────────────────────────────────────────────────
// FAQ source
// ─────────────────────────────────────────────────────────────────────
const FaqSchema = z.object({
  chatbotId: z.string().uuid(),
  title: z.string().min(1).max(200),
  raw: z.string().min(20).max(100_000),
});

export async function createFaqSourceAction(_prev: SourceFormState | null, fd: FormData): Promise<SourceFormState> {
  const session = await requireSession();
  const parsed = FaqSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    title: fd.get("title"),
    raw: fd.get("raw"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz SSS" };

  const items = parseFaqRaw(parsed.data.raw);
  if (items.length === 0) {
    return { ok: false, error: "Hiç Soru/Cevap bulunamadı. Her satır 'Soru | Cevap' formatında olmalı." };
  }

  const limitCheck = await assertSourceLimit(session.organizationId, session.planId);
  if (limitCheck) return limitCheck;

  const supabase = await getSupabaseServer();
  const { data: source, error } = await supabase
    .from("knowledge_sources")
    .insert({
      chatbot_id: parsed.data.chatbotId,
      organization_id: session.organizationId,
      type: "faq",
      title: parsed.data.title,
      status: "pending",
      metadata: { item_count: items.length },
    })
    .select("id")
    .single();
  if (error || !source) return { ok: false, error: error?.message ?? "Kaynak eklenemedi" };

  try {
    await ingestSource({
      sourceId: source.id,
      chatbotId: parsed.data.chatbotId,
      organizationId: session.organizationId,
      type: "faq",
      payload: { kind: "faq", title: parsed.data.title, items },
    });
  } catch (err) {
    revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
    return { ok: false, error: err instanceof Error ? err.message : "İşleme başarısız" };
  }

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  revalidatePath("/knowledge");
  return { ok: true, info: `${items.length} SSS başarıyla eğitildi.` };
}

// ─────────────────────────────────────────────────────────────────────
// Re-train / Delete
// ─────────────────────────────────────────────────────────────────────
export async function retrainSourceAction(sourceId: string) {
  const session = await requireSession();
  const supabase = await getSupabaseServer();

  const { data: src } = await supabase
    .from("knowledge_sources")
    .select("*")
    .eq("id", sourceId)
    .single();
  if (!src) return { ok: false, error: "Kaynak bulunamadı" };

  try {
    if (src.type === "website" && src.source_url) {
      await ingestSource({
        sourceId, chatbotId: src.chatbot_id, organizationId: session.organizationId,
        type: "website", payload: { kind: "url", url: src.source_url },
      });
    } else if (src.type === "manual" && src.raw_text) {
      await ingestSource({
        sourceId, chatbotId: src.chatbot_id, organizationId: session.organizationId,
        type: "manual", payload: { kind: "text", title: src.title, content: src.raw_text },
      });
    } else {
      return { ok: false, error: "Bu kaynak türü yeniden eğitilemez (raw veri tutulmadı)." };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Yeniden eğitim başarısız" };
  }

  revalidatePath(`/chatbots/${src.chatbot_id}`, "layout");
  revalidatePath("/knowledge");
  return { ok: true };
}

export async function deleteSourceAction(sourceId: string) {
  await requireSession();
  const admin = getSupabaseAdmin();
  // RLS-safe: scope deletion to the caller's org via a server-side check
  const supabase = await getSupabaseServer();
  const { data: src } = await supabase
    .from("knowledge_sources")
    .select("chatbot_id")
    .eq("id", sourceId)
    .single();
  if (!src) return { ok: false };
  await admin.from("knowledge_sources").delete().eq("id", sourceId);
  revalidatePath(`/chatbots/${src.chatbot_id}`, "layout");
  revalidatePath("/knowledge");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────
async function assertSourceLimit(organizationId: string, planId: keyof typeof PLAN_LIMITS): Promise<SourceFormState | null> {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("knowledge_sources")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  const limit = PLAN_LIMITS[planId].sourceLimit;
  if ((count ?? 0) >= limit) {
    return { ok: false, error: `${planId.toUpperCase()} planı en fazla ${limit} kaynak içerir.` };
  }
  return null;
}

function cleanUrlForTitle(url: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname + (u.pathname && u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

/**
 * Parses raw FAQ text into Q/A pairs. Supports two formats:
 *  1) Pipe:   "Soru? | Cevap"
 *  2) Block:  "Q: Soru?\nA: Cevap" (blocks separated by blank lines)
 */
function parseFaqRaw(raw: string): { question: string; answer: string }[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const out: { question: string; answer: string }[] = [];

  // Try block format first (Q:/A: with blank line separators).
  if (/^q[:.]/im.test(trimmed)) {
    const blocks = trimmed.split(/\n\s*\n/);
    for (const block of blocks) {
      const qMatch = block.match(/q[:.]\s*([\s\S]+?)\n\s*a[:.]/i);
      const aMatch = block.match(/a[:.]\s*([\s\S]+)$/i);
      if (qMatch && aMatch) {
        out.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
      }
    }
    if (out.length > 0) return out;
  }

  // Fall back to pipe format (one per line).
  for (const line of trimmed.split("\n")) {
    const idx = line.indexOf("|");
    if (idx < 1) continue;
    const q = line.slice(0, idx).trim();
    const a = line.slice(idx + 1).trim();
    if (q && a) out.push({ question: q, answer: a });
  }
  return out;
}
