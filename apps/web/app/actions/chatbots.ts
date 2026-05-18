"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plans/limits";

// ─────────────────────────────────────────────────────────────────────────
// Step 1: Create draft chatbot
// ─────────────────────────────────────────────────────────────────────────
const StepInfoSchema = z.object({
  name: z.string().min(1, "Bot adı gerekli").max(80),
  businessName: z.string().max(120).optional(),
  language: z.enum(["tr", "en", "auto"]),
  purpose: z.enum(["support", "sales", "lead", "faq", "general"]),
});

export type FormState = { ok: boolean; error?: string; chatbotId?: string };

export async function createChatbotAction(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = StepInfoSchema.safeParse({
    name: fd.get("name"),
    businessName: fd.get("businessName") || undefined,
    language: fd.get("language") ?? "auto",
    purpose: fd.get("purpose") ?? "support",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };

  // Plan limit check
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("chatbots")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organizationId);

  const limit = PLAN_LIMITS[session.planId].chatbotLimit;
  if ((count ?? 0) >= limit) {
    return { ok: false, error: `${session.planId.toUpperCase()} planı en fazla ${limit} chatbot içerir. Planını yükselt.` };
  }

  const defaults = makeDefaults(parsed.data.language, parsed.data.purpose);

  const { data, error } = await supabase
    .from("chatbots")
    .insert({
      organization_id: session.organizationId,
      name: parsed.data.name,
      business_name: parsed.data.businessName ?? null,
      language: parsed.data.language,
      purpose: parsed.data.purpose,
      tone: defaults.tone,
      answer_length: "normal",
      welcome_message: defaults.welcomeMessage,
      fallback_message: defaults.fallbackMessage,
      primary_color: "#6554E8",
      widget_position: "bottom-right",
      theme: "light",
      quick_questions: defaults.quickQuestions,
      is_active: false,            // becomes true at the publish step
      strict_knowledge_base: true,
      show_lead_form_on_fallback: true,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Bot oluşturulamadı" };

  revalidatePath("/chatbots");
  redirect(`/chatbots/${data.id}/setup?step=sources`);
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3: Behavior
// ─────────────────────────────────────────────────────────────────────────
const StepBehaviorSchema = z.object({
  chatbotId: z.string().uuid(),
  welcomeMessage: z.string().max(500),
  fallbackMessage: z.string().max(500),
  tone: z.enum(["professional", "friendly", "concise", "sales"]),
  answerLength: z.enum(["short", "normal", "detailed"]),
  strictKnowledgeBase: z.boolean(),
  showLeadFormOnFallback: z.boolean(),
});

export async function saveBehaviorAction(_prev: FormState | null, fd: FormData): Promise<FormState> {
  await requireSession();
  const parsed = StepBehaviorSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    welcomeMessage: fd.get("welcomeMessage") ?? "",
    fallbackMessage: fd.get("fallbackMessage") ?? "",
    tone: fd.get("tone"),
    answerLength: fd.get("answerLength"),
    strictKnowledgeBase: fd.get("strictKnowledgeBase") === "on",
    showLeadFormOnFallback: fd.get("showLeadFormOnFallback") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("chatbots")
    .update({
      welcome_message: parsed.data.welcomeMessage,
      fallback_message: parsed.data.fallbackMessage,
      tone: parsed.data.tone,
      answer_length: parsed.data.answerLength,
      strict_knowledge_base: parsed.data.strictKnowledgeBase,
      show_lead_form_on_fallback: parsed.data.showLeadFormOnFallback,
    })
    .eq("id", parsed.data.chatbotId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  redirect(`/chatbots/${parsed.data.chatbotId}/setup?step=appearance`);
}

// ─────────────────────────────────────────────────────────────────────────
// Step 4: Appearance
// ─────────────────────────────────────────────────────────────────────────
const StepAppearanceSchema = z.object({
  chatbotId: z.string().uuid(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Geçersiz renk"),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]),
  theme: z.enum(["light", "dark", "system"]),
  quickQuestionsRaw: z.string().max(500).optional(),
});

export async function saveAppearanceAction(_prev: FormState | null, fd: FormData): Promise<FormState> {
  await requireSession();
  const parsed = StepAppearanceSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    primaryColor: fd.get("primaryColor") ?? "#6554E8",
    widgetPosition: fd.get("widgetPosition") ?? "bottom-right",
    theme: fd.get("theme") ?? "light",
    quickQuestionsRaw: fd.get("quickQuestions") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };

  const quickQuestions = (parsed.data.quickQuestionsRaw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((label) => ({ label }));

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("chatbots")
    .update({
      primary_color: parsed.data.primaryColor,
      widget_position: parsed.data.widgetPosition,
      theme: parsed.data.theme,
      quick_questions: quickQuestions,
    })
    .eq("id", parsed.data.chatbotId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  redirect(`/chatbots/${parsed.data.chatbotId}/setup?step=test`);
}

// ─────────────────────────────────────────────────────────────────────────
// Step 6: Publish (activate + add allowed domain)
// ─────────────────────────────────────────────────────────────────────────
const StepPublishSchema = z.object({
  chatbotId: z.string().uuid(),
  allowedDomain: z.string().max(200).optional(),
});

export async function publishChatbotAction(_prev: FormState | null, fd: FormData): Promise<FormState> {
  await requireSession();
  const parsed = StepPublishSchema.safeParse({
    chatbotId: fd.get("chatbotId"),
    allowedDomain: fd.get("allowedDomain") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };

  const supabase = await getSupabaseServer();

  const { data: existing } = await supabase
    .from("chatbots")
    .select("allowed_domains")
    .eq("id", parsed.data.chatbotId)
    .single();

  const next = new Set<string>(((existing?.allowed_domains as string[] | null) ?? []));
  if (parsed.data.allowedDomain) {
    next.add(normalizeDomain(parsed.data.allowedDomain));
  }

  const { error } = await supabase
    .from("chatbots")
    .update({ is_active: true, allowed_domains: Array.from(next) })
    .eq("id", parsed.data.chatbotId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/chatbots/${parsed.data.chatbotId}`, "layout");
  revalidatePath("/chatbots");
  revalidatePath("/overview");
  return { ok: true, chatbotId: parsed.data.chatbotId };
}

// ─────────────────────────────────────────────────────────────────────────
// Toggle active / delete
// ─────────────────────────────────────────────────────────────────────────
export async function setChatbotActiveAction(chatbotId: string, isActive: boolean) {
  await requireSession();
  const supabase = await getSupabaseServer();
  await supabase.from("chatbots").update({ is_active: isActive }).eq("id", chatbotId);
  revalidatePath(`/chatbots/${chatbotId}`, "layout");
  revalidatePath("/chatbots");
}

export async function deleteChatbotAction(chatbotId: string) {
  await requireSession();
  const supabase = await getSupabaseServer();
  await supabase.from("chatbots").delete().eq("id", chatbotId);
  revalidatePath("/chatbots");
  redirect("/chatbots");
}

// ─────────────────────────────────────────────────────────────────────────
// Allowed domains add / remove
// ─────────────────────────────────────────────────────────────────────────
export async function addAllowedDomainAction(chatbotId: string, rawDomain: string): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  const cleaned = normalizeDomain(rawDomain);
  if (!cleaned) return { ok: false, error: "Geçersiz domain" };
  if (cleaned.length > 200) return { ok: false, error: "Domain çok uzun" };
  if (!/^[a-z0-9.*-]+\.[a-z]{2,}$/.test(cleaned)) {
    return { ok: false, error: "Geçersiz domain formatı (örn. ornek.com veya *.ornek.com)" };
  }

  const supabase = await getSupabaseServer();
  const { data: existing } = await supabase
    .from("chatbots")
    .select("allowed_domains")
    .eq("id", chatbotId)
    .single();
  if (!existing) return { ok: false, error: "Bot bulunamadı" };

  const next = new Set<string>(((existing.allowed_domains as string[] | null) ?? []));
  next.add(cleaned);

  const { error } = await supabase
    .from("chatbots")
    .update({ allowed_domains: Array.from(next) })
    .eq("id", chatbotId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/chatbots/${chatbotId}`, "layout");
  return { ok: true };
}

export async function removeAllowedDomainAction(chatbotId: string, domain: string): Promise<{ ok: boolean; error?: string }> {
  await requireSession();
  const supabase = await getSupabaseServer();
  const { data: existing } = await supabase
    .from("chatbots")
    .select("allowed_domains")
    .eq("id", chatbotId)
    .single();
  if (!existing) return { ok: false, error: "Bot bulunamadı" };

  const next = ((existing.allowed_domains as string[] | null) ?? []).filter((d) => d !== domain);

  const { error } = await supabase
    .from("chatbots")
    .update({ allowed_domains: next })
    .eq("id", chatbotId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/chatbots/${chatbotId}`, "layout");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────
function makeDefaults(language: "tr" | "en" | "auto", purpose: string) {
  const tr = language !== "en";
  const welcomeMessage = tr
    ? "Merhaba 👋 Size nasıl yardımcı olabilirim?"
    : "Hi 👋 How can I help you today?";
  const fallbackMessage = tr
    ? "Bu konuda net bilgi bulamadım. İsterseniz iletişim bilgilerinizi bırakın, ekibimiz size dönüş yapsın."
    : "I couldn't find exact information about this. You can leave your contact details and our team will get back to you.";

  const quickQuestions = tr
    ? [{ label: "Kargo süresi kaç gün?" }, { label: "İade nasıl?" }, { label: "İletişime geç" }]
    : [{ label: "Shipping time?" }, { label: "How do returns work?" }, { label: "Contact us" }];

  const tone: "professional" | "friendly" | "concise" | "sales" =
    purpose === "sales" ? "sales" : purpose === "lead" ? "sales" : "friendly";

  return { welcomeMessage, fallbackMessage, quickQuestions, tone };
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}
