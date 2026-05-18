import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/get-session";
import { getChatbot } from "@/lib/chatbots/repo";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { ingestSource } from "@/lib/rag/ingest";
import { sourceTypeFromMime } from "@/lib/rag/extract-file";
import { PLAN_LIMITS } from "@/lib/plans/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

const MAX_BYTES_FALLBACK = 25 * 1024 * 1024;   // 25MB default; plan can raise

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const chatbot = await getChatbot(id);
  if (!chatbot || chatbot.organization_id !== session.organizationId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  const customTitle = (formData.get("title") as string | null)?.trim() || null;
  if (!(file instanceof File)) {
    return Response.json({ error: "file alanı gerekli" }, { status: 400 });
  }

  // Validate type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const knownExt = ["pdf", "docx", "txt", "md"].includes(ext);
  if (!ALLOWED_TYPES.has(file.type) && !knownExt) {
    return Response.json(
      { error: "Yalnızca PDF, DOCX, TXT ve MD dosyaları kabul edilir." },
      { status: 400 }
    );
  }

  // Validate size (plan-based)
  const maxBytes = (PLAN_LIMITS[session.planId].fileSizeLimitMb ?? 25) * 1024 * 1024;
  if (file.size > maxBytes) {
    return Response.json(
      { error: `Dosya çok büyük. Maksimum ${Math.round(maxBytes / 1024 / 1024)} MB.` },
      { status: 413 }
    );
  }

  // Source quota
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("knowledge_sources")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organizationId);
  const limit = PLAN_LIMITS[session.planId].sourceLimit;
  if ((count ?? 0) >= limit) {
    return Response.json(
      { error: `${session.planId.toUpperCase()} planı en fazla ${limit} kaynak içerir.` },
      { status: 402 }
    );
  }

  const sourceType = sourceTypeFromMime(file.type, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  // Create source row first (status: pending) so the UI can show progress
  const admin = getSupabaseAdmin();
  const { data: source, error: insertErr } = await admin
    .from("knowledge_sources")
    .insert({
      chatbot_id: chatbot.id,
      organization_id: session.organizationId,
      type: sourceType,
      title: customTitle ?? file.name,
      status: "pending",
      metadata: { mime: file.type || null, size_bytes: file.size },
    })
    .select("id")
    .single();
  if (insertErr || !source) {
    return Response.json({ error: insertErr?.message ?? "Kaynak oluşturulamadı" }, { status: 500 });
  }

  // Upload to Storage (best-effort; we keep raw bytes for re-train later)
  const storagePath = `${session.organizationId}/${chatbot.id}/${source.id}.${ext || sourceType}`;
  const { error: uploadErr } = await admin.storage
    .from("chativo-uploads")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (uploadErr) {
    // Non-fatal — we still have the buffer for extraction
    console.warn("[upload] storage upload failed:", uploadErr.message);
  } else {
    await admin
      .from("knowledge_sources")
      .update({ file_url: storagePath })
      .eq("id", source.id);
  }

  // Run ingest synchronously (MVP — large files should move to BullMQ in Faz 2)
  try {
    const result = await ingestSource({
      sourceId: source.id,
      chatbotId: chatbot.id,
      organizationId: session.organizationId,
      type: sourceType,
      payload: { kind: "file", filename: file.name, mimeType: file.type, buffer },
    });

    revalidatePath(`/chatbots/${chatbot.id}`, "layout");
    revalidatePath("/knowledge");
    return Response.json({
      ok: true,
      sourceId: source.id,
      chunks: result.chunkCount,
    });
  } catch (err) {
    revalidatePath(`/chatbots/${chatbot.id}`, "layout");
    return Response.json(
      { error: err instanceof Error ? err.message : "İşleme başarısız" },
      { status: 500 }
    );
  }
}
