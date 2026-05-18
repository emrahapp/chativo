"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { LoginSchema, RegisterSchema } from "@chativo/shared";

export type AuthState = {
  ok: boolean;
  error?: string;
  // For "check your email" screens
  info?: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signInAction(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: mapAuthError(error.message) };

  const next = (formData.get("next") as string | null) ?? "/overview";
  revalidatePath("/", "layout");
  redirect(safeRedirect(next));
}

export async function signUpAction(_prev: AuthState | null, formData: FormData): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
    locale: (formData.get("locale") as string | null) ?? "tr",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Geçersiz bilgi" };
  }

  const supabase = await getSupabaseServer();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name, locale: parsed.data.locale },
      emailRedirectTo: `${appUrl()}/api/auth/callback?next=/overview`,
    },
  });
  if (error) return { ok: false, error: mapAuthError(error.message) };

  // If email confirmation is required, no session is returned.
  if (!data.session) {
    return {
      ok: true,
      info: "Hesabınızı doğrulamak için e-postanızı kontrol edin.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/overview");
}

export async function signOutAction() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordRequestAction(
  _prev: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { ok: false, error: "E-posta gerekli" };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/api/auth/callback?next=/settings`,
  });
  if (error) return { ok: false, error: mapAuthError(error.message) };

  return { ok: true, info: "Şifre sıfırlama bağlantısı e-postanıza gönderildi." };
}

// ── helpers ─────────────────────────────────────────────────────────
function safeRedirect(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return "/overview";
  return next;
}

function mapAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/email not confirmed/i.test(msg)) return "E-postanızı önce doğrulayın.";
  if (/user already registered/i.test(msg)) return "Bu e-posta zaten kayıtlı.";
  if (/password.*at least.*characters/i.test(msg)) return "Şifre en az 8 karakter olmalı.";
  return msg;
}
