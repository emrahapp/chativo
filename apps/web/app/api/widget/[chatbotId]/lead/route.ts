import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadWidgetChatbot, corsHeaders } from "@/lib/widget/auth-widget";
import { checkRate, clientIpFromHeaders } from "@/lib/widget/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  conversationId: z.string().uuid(),
  visitorId: z.string().min(1).max(100),
  name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
}).refine((d) => d.email || d.phone, { message: "email or phone required" });

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  const origin = req.headers.get("origin");
  const { chatbotId } = await params;

  const auth = await loadWidgetChatbot(chatbotId, origin);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status, headers: corsHeaders(origin) });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid body";
    return Response.json({ error: message }, { status: 400, headers: corsHeaders(origin) });
  }

  const ip = clientIpFromHeaders(req.headers);
  const rl = checkRate({ namespace: "lead-ip", key: `${chatbotId}:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429, headers: corsHeaders(origin) });

  const admin = getSupabaseAdmin();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      chatbot_id: auth.chatbot.id,
      organization_id: auth.chatbot.organization_id,
      conversation_id: body.conversationId,
      name: body.name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      company: body.company ?? null,
      message: body.message ?? null,
    })
    .select("id")
    .single();
  if (error || !lead) {
    return Response.json({ error: error?.message ?? "Lead insert failed" }, { status: 500, headers: corsHeaders(origin) });
  }

  // Link lead onto conversation for the dashboard.
  await admin.from("conversations").update({ lead_id: lead.id }).eq("id", body.conversationId);

  return Response.json({ ok: true, leadId: lead.id }, { headers: corsHeaders(origin) });
}
