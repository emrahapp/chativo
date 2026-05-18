"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { PlanId } from "@chativo/shared";

const PlanSchema = z.enum(["free", "starter", "pro", "agency"]);

export async function setOrganizationPlanAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminSession();
  const organizationId = String(formData.get("organizationId") ?? "");
  const planRaw = String(formData.get("planId") ?? "");
  if (!organizationId) return { ok: false, error: "organizationId gerekli" };
  const parsed = PlanSchema.safeParse(planRaw);
  if (!parsed.success) return { ok: false, error: "Geçersiz plan" };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organizations")
    .update({ plan_id: parsed.data as PlanId })
    .eq("id", organizationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  return { ok: true };
}

export async function toggleUserAdminAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "");
  const next = formData.get("nextValue") === "true";
  if (!userId) return { ok: false, error: "userId gerekli" };
  if (userId === me.userId && !next) {
    return { ok: false, error: "Kendi admin yetkini kaldıramazsın." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("profiles").update({ is_admin: next }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setChatbotActiveAdminAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminSession();
  const chatbotId = String(formData.get("chatbotId") ?? "");
  const next = formData.get("nextValue") === "true";
  if (!chatbotId) return { ok: false, error: "chatbotId gerekli" };

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("chatbots").update({ is_active: next }).eq("id", chatbotId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/chatbots");
  return { ok: true };
}
