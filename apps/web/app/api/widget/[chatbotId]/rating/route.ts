import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadWidgetChatbot, corsHeaders } from "@/lib/widget/auth-widget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  conversationId: z.string().uuid(),
  rating: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  const origin = req.headers.get("origin");
  const { chatbotId } = await params;

  const auth = await loadWidgetChatbot(chatbotId, origin);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status, headers: corsHeaders(origin) });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400, headers: corsHeaders(origin) });
  }

  const admin = getSupabaseAdmin();
  await admin.from("conversations").update({ rating: body.rating }).eq("id", body.conversationId);

  return Response.json({ ok: true }, { headers: corsHeaders(origin) });
}
