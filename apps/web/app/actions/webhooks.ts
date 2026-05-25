"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { dispatchEvent, generateWebhookSecret, type WebhookEvent } from "@/lib/webhooks/dispatch";

export type WebhookFormState = { ok: boolean; error?: string; info?: string };

const ALL_EVENTS: WebhookEvent[] = [
  "lead.created",
  "conversation.created",
  "message.received",
  "source.completed",
  "source.failed",
];

const CreateSchema = z.object({
  url: z.string().url("Geçerli bir URL gerek").max(500),
  events: z.array(z.string()).max(20).optional(),
});

export async function createWebhookAction(_prev: WebhookFormState | null, fd: FormData): Promise<WebhookFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Yetki yok" };
  }
  const events = fd.getAll("events").map(String).filter((e) => ALL_EVENTS.includes(e as WebhookEvent));
  const parsed = CreateSchema.safeParse({ url: fd.get("url"), events });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz" };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("webhook_subscriptions")
    .insert({
      organization_id: session.organizationId,
      url: parsed.data.url,
      events: parsed.data.events ?? [],
      secret: generateWebhookSecret(),
      is_active: true,
    });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, info: "Webhook eklendi." };
}

export async function deleteWebhookAction(id: string): Promise<WebhookFormState> {
  await requireSession();
  const admin = getSupabaseAdmin();
  await admin.from("webhook_subscriptions").delete().eq("id", id);
  revalidatePath("/settings");
  return { ok: true };
}

export async function testWebhookAction(id: string): Promise<WebhookFormState> {
  const session = await requireSession();
  const admin = getSupabaseAdmin();
  const { data: sub } = await admin
    .from("webhook_subscriptions")
    .select("*")
    .eq("id", id)
    .single();
  if (!sub) return { ok: false, error: "Webhook bulunamadı" };

  // Fire a test event
  await dispatchEvent({
    organizationId: session.organizationId,
    eventType: "conversation.created",
    payload: {
      test: true,
      sentAt: new Date().toISOString(),
      message: "Bu bir Chativo test webhook'udur.",
    },
  });

  revalidatePath("/settings");
  return { ok: true, info: "Test webhook gönderildi. Delivery log'undan sonucu gör." };
}

export async function toggleWebhookActiveAction(id: string, isActive: boolean): Promise<WebhookFormState> {
  await requireSession();
  const admin = getSupabaseAdmin();
  await admin.from("webhook_subscriptions").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/settings");
  return { ok: true };
}
