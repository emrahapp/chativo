import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { telegramAdapter } from "@/lib/channels/telegram";
import { ingestChannelMessage } from "@/lib/channels/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Telegram webhook receiver. Each org has its own webhook URL with the org id
 * in the path; Telegram authenticates via X-Telegram-Bot-Api-Secret-Token.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const expectedSecret = req.headers.get("x-telegram-bot-api-secret-token");

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("id, telegram_bot_token_encrypted")
    .eq("id", orgId)
    .single();
  if (!org?.telegram_bot_token_encrypted) {
    return new Response("not_configured", { status: 404 });
  }

  // The secret is the org id itself for simplicity (changeable later)
  if (expectedSecret !== orgId) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("bad_json", { status: 400 });
  }

  const inbound = telegramAdapter.parseInbound(body as never);
  if (!inbound) {
    // not a text message — ack so Telegram doesn't retry
    return Response.json({ ok: true, skipped: true });
  }

  // Log raw event
  await admin.from("channel_events").insert({
    organization_id: orgId,
    channel: "telegram",
    external_id: inbound.externalMessageId,
    payload: body as object,
    processed_at: new Date().toISOString(),
  });

  // Reply in background — Telegram only waits a few seconds
  void ingestChannelMessage({ organizationId: orgId, msg: inbound, adapter: telegramAdapter }).catch((e) => {
    console.error("[telegram ingest]", e);
  });

  return Response.json({ ok: true });
}
