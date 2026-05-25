import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { whatsappAdapter } from "@/lib/channels/whatsapp";
import { ingestChannelMessage } from "@/lib/channels/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Meta verification handshake. When you register a webhook in Meta dashboard
 * they send: GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 * We check verify_token against ANY organization that registered it.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("bad_request", { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("whatsapp_verify_token", token)
    .maybeSingle();
  if (!org) return new Response("forbidden", { status: 403 });

  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

/**
 * Receives inbound WhatsApp messages.
 * We map message.metadata.phone_number_id → organization to know which tenant.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("bad_json", { status: 400 });
  }

  const { messages, phoneId } = whatsappAdapter.parseInbound(body);
  if (!phoneId) return Response.json({ ok: true, skipped: "no_phone_id" });

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("whatsapp_phone_id", phoneId)
    .maybeSingle();
  if (!org) {
    return Response.json({ ok: true, skipped: "org_not_found" });
  }

  // Log raw
  await admin.from("channel_events").insert({
    organization_id: org.id,
    channel: "whatsapp",
    external_id: messages[0]?.externalMessageId ?? null,
    payload: body,
    processed_at: new Date().toISOString(),
  });

  // Fire each message into the pipeline (don't block Meta)
  for (const msg of messages) {
    void ingestChannelMessage({ organizationId: org.id as string, msg, adapter: whatsappAdapter }).catch((e) => {
      console.error("[whatsapp ingest]", e);
    });
  }

  return Response.json({ ok: true });
}
