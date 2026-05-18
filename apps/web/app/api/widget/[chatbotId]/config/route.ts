import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadWidgetChatbot, corsHeaders } from "@/lib/widget/auth-widget";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import type { ChatbotPublicConfig } from "@chativo/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
  const origin = req.headers.get("origin");
  const { chatbotId } = await params;

  const auth = await loadWidgetChatbot(chatbotId, origin);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status, headers: corsHeaders(origin) });
  }

  // Look up plan for branding removal
  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("plan_id")
    .eq("id", auth.chatbot.organization_id)
    .single();
  const planId = (org?.plan_id ?? "free") as keyof typeof PLAN_LIMITS;
  const removeBranding = PLAN_LIMITS[planId].removeBranding;

  const cfg: ChatbotPublicConfig = {
    id: auth.chatbot.id,
    name: auth.chatbot.name,
    businessName: auth.chatbot.business_name,
    language: auth.chatbot.language,
    primaryColor: auth.chatbot.primary_color,
    logoUrl: auth.chatbot.logo_url,
    avatarUrl: auth.chatbot.avatar_url,
    widgetPosition: auth.chatbot.widget_position,
    theme: auth.chatbot.theme,
    welcomeMessage: auth.chatbot.welcome_message,
    quickQuestions: auth.chatbot.quick_questions ?? [],
    showLeadFormOnFallback: auth.chatbot.show_lead_form_on_fallback,
    showBranding: !removeBranding,
  };

  return Response.json(cfg, {
    headers: { ...corsHeaders(origin), "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
