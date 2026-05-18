import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface SessionContext {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  locale: "tr" | "en";
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  role: "owner" | "admin" | "agent" | "viewer";
  planId: "free" | "starter" | "pro" | "agency";
  isAdmin: boolean;
}

/**
 * Loads the current user, their default organization, and plan.
 * Returns null if unauthenticated.
 */
export async function getCurrentSession(): Promise<SessionContext | null> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Single round-trip: profile + first org membership
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, avatar_url, locale, is_admin")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, slug, name, plan_id)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!member?.organization) return null;
  const org = member.organization as unknown as {
    id: string; slug: string; name: string; plan_id: SessionContext["planId"];
  };

  // Admin status: profiles.is_admin OR matches ADMIN_EMAILS env (bootstrap).
  const envAdmins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = (profile.is_admin ?? false) || envAdmins.includes(profile.email.toLowerCase());

  return {
    userId: profile.id,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    locale: (profile.locale === "en" ? "en" : "tr") as "tr" | "en",
    organizationId: org.id,
    organizationSlug: org.slug,
    organizationName: org.name,
    role: member.role as SessionContext["role"],
    planId: org.plan_id,
    isAdmin,
  };
}

/** Use inside admin routes — 404s if caller is not admin. */
export async function requireAdminSession() {
  const session = await requireSession();
  if (!session.isAdmin) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return session;
}

/** Use inside protected Server Components — redirects if not signed in. */
export async function requireSession(): Promise<SessionContext> {
  const s = await getCurrentSession();
  if (!s) redirect("/login");
  return s;
}
