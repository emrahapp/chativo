"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer } from "@/lib/supabase/server";

export type AccountFormState = { ok: boolean; error?: string; info?: string };

// ── Profile ─────────────────────────────────────────────────
const ProfileSchema = z.object({
  name: z.string().min(1).max(120).optional().or(z.literal("")),
  locale: z.enum(["tr", "en"]).default("tr"),
});

export async function updateProfileAction(
  _prev: AccountFormState | null,
  fd: FormData
): Promise<AccountFormState> {
  const session = await requireSession();
  const parsed = ProfileSchema.safeParse({
    name: fd.get("name") ?? "",
    locale: (fd.get("locale") as string) ?? "tr",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz" };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: (parsed.data.name?.trim() || null) as string | null,
      locale: parsed.data.locale,
    })
    .eq("id", session.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, info: "Profil güncellendi." };
}

// ── Organization ─────────────────────────────────────────────
const OrgSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function updateOrganizationAction(
  _prev: AccountFormState | null,
  fd: FormData
): Promise<AccountFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { ok: false, error: "Bu işlem için yetkin yok." };
  }

  const parsed = OrgSchema.safeParse({ name: fd.get("name") });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz" };

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name })
    .eq("id", session.organizationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, info: "Organizasyon güncellendi." };
}
