import "server-only";
import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Outgoing webhook dispatcher. Fire-and-forget.
 *
 * Reads webhook_subscriptions for the org, filters by event type, POSTs the
 * signed payload, logs delivery. Failures are recorded but don't retry yet
 * (Faz 2 ileri: BullMQ retry queue).
 */

export type WebhookEvent =
  | "lead.created"
  | "conversation.created"
  | "message.received"
  | "source.completed"
  | "source.failed";

interface DispatchArgs {
  organizationId: string;
  eventType: WebhookEvent;
  payload: Record<string, unknown>;
}

export async function dispatchEvent({ organizationId, eventType, payload }: DispatchArgs): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data: subs } = await admin
    .from("webhook_subscriptions")
    .select("id, url, events, secret, is_active")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
  if (!subs?.length) return;

  const body = JSON.stringify({
    event: eventType,
    organizationId,
    occurredAt: new Date().toISOString(),
    data: payload,
  });

  for (const sub of subs) {
    const events = (sub.events as string[] | null) ?? [];
    if (events.length > 0 && !events.includes(eventType)) continue;

    const signature = signBody(body, sub.secret as string);

    // Don't await — fire and forget, but log delivery asynchronously
    void deliverOnce(sub.id as string, sub.url as string, body, signature, eventType, payload);
  }
}

async function deliverOnce(
  subId: string,
  url: string,
  body: string,
  signature: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>
) {
  const admin = getSupabaseAdmin();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Chativo-Event": eventType,
        "X-Chativo-Signature": signature,
        "User-Agent": "Chativo-Webhook/1.0",
      },
      body,
    });
    const respText = await res.text().catch(() => "");
    await admin.from("webhook_deliveries").insert({
      webhook_subscription_id: subId,
      event_type: eventType,
      payload,
      response_status: res.status,
      response_body: respText.slice(0, 2000),
      delivered_at: res.ok ? new Date().toISOString() : null,
      failed_at: res.ok ? null : new Date().toISOString(),
    });
  } catch (err) {
    await admin.from("webhook_deliveries").insert({
      webhook_subscription_id: subId,
      event_type: eventType,
      payload,
      response_status: null,
      response_body: (err instanceof Error ? err.message : "fetch failed").slice(0, 500),
      delivered_at: null,
      failed_at: new Date().toISOString(),
    });
  } finally {
    clearTimeout(t);
  }
}

function signBody(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

export function generateWebhookSecret(): string {
  // 32 bytes hex
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
