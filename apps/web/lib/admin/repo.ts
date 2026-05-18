import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import type { PlanId } from "@chativo/shared";

export interface AdminOverview {
  totals: {
    users: number;
    organizations: number;
    chatbots: number;
    sources: number;
    conversations: number;
    leads: number;
    messages30d: number;
  };
  topOrgs: {
    id: string;
    name: string;
    slug: string;
    planId: PlanId;
    messages: number;
    monthlyLimit: number;
    pct: number;
  }[];
  failedSources: {
    id: string;
    title: string;
    type: string;
    error_message: string | null;
    organization: { id: string; name: string } | null;
    created_at: string;
  }[];
  planDistribution: { planId: PlanId; count: number }[];
}

const since30 = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 29);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = getSupabaseAdmin();
  const sinceDate = since30();

  const [
    { count: users },
    { count: orgs },
    { count: bots },
    { count: sources },
    { count: convos },
    { count: leads },
    { data: usage },
    { data: orgRows },
    { data: failed },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("organizations").select("id", { count: "exact", head: true }),
    admin.from("chatbots").select("id", { count: "exact", head: true }),
    admin.from("knowledge_sources").select("id", { count: "exact", head: true }),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }),
    admin
      .from("usage_logs")
      .select("organization_id, message_count")
      .gte("date", sinceDate),
    admin
      .from("organizations")
      .select("id, name, slug, plan_id"),
    admin
      .from("knowledge_sources")
      .select("id, title, type, error_message, created_at, organization:organizations(id, name)")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Aggregate usage per org
  const usageByOrg = new Map<string, number>();
  let total30 = 0;
  for (const u of usage ?? []) {
    const o = u.organization_id as string;
    usageByOrg.set(o, (usageByOrg.get(o) ?? 0) + (u.message_count ?? 0));
    total30 += u.message_count ?? 0;
  }

  const topOrgs = (orgRows ?? [])
    .map((o) => {
      const planId = (o.plan_id ?? "free") as PlanId;
      const limit = PLAN_LIMITS[planId].monthlyMessageLimit;
      const messages = usageByOrg.get(o.id as string) ?? 0;
      return {
        id: o.id as string,
        name: o.name as string,
        slug: o.slug as string,
        planId,
        messages,
        monthlyLimit: limit,
        pct: limit > 0 ? Math.min(100, Math.round((messages / limit) * 100)) : 0,
      };
    })
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 8);

  const planDistribution: AdminOverview["planDistribution"] = [];
  {
    const counts = new Map<PlanId, number>();
    for (const o of orgRows ?? []) {
      const p = (o.plan_id ?? "free") as PlanId;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    for (const planId of ["free", "starter", "pro", "agency"] as PlanId[]) {
      planDistribution.push({ planId, count: counts.get(planId) ?? 0 });
    }
  }

  const failedSources = (failed ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    error_message: s.error_message,
    organization: s.organization ? { id: s.organization.id, name: s.organization.name } : null,
    created_at: s.created_at,
  }));

  return {
    totals: {
      users: users ?? 0,
      organizations: orgs ?? 0,
      chatbots: bots ?? 0,
      sources: sources ?? 0,
      conversations: convos ?? 0,
      leads: leads ?? 0,
      messages30d: total30,
    },
    topOrgs,
    failedSources,
    planDistribution,
  };
}

export interface AdminOrgRow {
  id: string;
  name: string;
  slug: string;
  planId: PlanId;
  ownerEmail: string | null;
  memberCount: number;
  chatbotCount: number;
  monthlyMessages: number;
  monthlyLimit: number;
  createdAt: string;
}

export async function listAllOrganizations(): Promise<AdminOrgRow[]> {
  const admin = getSupabaseAdmin();
  const sinceDate = since30();

  const [{ data: orgs }, { data: members }, { data: bots }, { data: usage }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug, plan_id, created_at, owner:profiles!organizations_owner_id_fkey(email)"),
    admin.from("organization_members").select("organization_id"),
    admin.from("chatbots").select("organization_id"),
    admin.from("usage_logs").select("organization_id, message_count").gte("date", sinceDate),
  ]);

  const memberCount = new Map<string, number>();
  for (const m of members ?? []) {
    memberCount.set(m.organization_id as string, (memberCount.get(m.organization_id as string) ?? 0) + 1);
  }
  const botCount = new Map<string, number>();
  for (const b of bots ?? []) {
    botCount.set(b.organization_id as string, (botCount.get(b.organization_id as string) ?? 0) + 1);
  }
  const usageByOrg = new Map<string, number>();
  for (const u of usage ?? []) {
    usageByOrg.set(
      u.organization_id as string,
      (usageByOrg.get(u.organization_id as string) ?? 0) + (u.message_count ?? 0)
    );
  }

  return (orgs ?? []).map((o: any) => {
    const planId = (o.plan_id ?? "free") as PlanId;
    return {
      id: o.id,
      name: o.name,
      slug: o.slug,
      planId,
      ownerEmail: o.owner?.email ?? null,
      memberCount: memberCount.get(o.id) ?? 0,
      chatbotCount: botCount.get(o.id) ?? 0,
      monthlyMessages: usageByOrg.get(o.id) ?? 0,
      monthlyLimit: PLAN_LIMITS[planId].monthlyMessageLimit,
      createdAt: o.created_at,
    };
  });
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  locale: string;
  createdAt: string;
  organizations: { id: string; name: string; role: string }[];
}

export async function listAllUsers(): Promise<AdminUserRow[]> {
  const admin = getSupabaseAdmin();
  const [{ data: profiles }, { data: memberships }] = await Promise.all([
    admin.from("profiles").select("id, email, name, is_admin, locale, created_at"),
    admin
      .from("organization_members")
      .select("user_id, role, organization:organizations(id, name)"),
  ]);

  const orgsByUser = new Map<string, AdminUserRow["organizations"]>();
  for (const m of memberships ?? []) {
    const arr = orgsByUser.get(m.user_id as string) ?? [];
    const org = m.organization as unknown as { id: string; name: string } | null;
    if (org) arr.push({ id: org.id, name: org.name, role: m.role as string });
    orgsByUser.set(m.user_id as string, arr);
  }

  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: p.email,
    name: p.name ?? null,
    isAdmin: p.is_admin ?? false,
    locale: p.locale ?? "tr",
    createdAt: p.created_at,
    organizations: orgsByUser.get(p.id) ?? [],
  }));
}

export interface AdminChatbotRow {
  id: string;
  name: string;
  business_name: string | null;
  isActive: boolean;
  language: string;
  organization: { id: string; name: string } | null;
  sourceCount: number;
  createdAt: string;
}

export async function listAllChatbots(): Promise<AdminChatbotRow[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("chatbots")
    .select(`
      id, name, business_name, is_active, language, created_at,
      organization:organizations(id, name),
      sources:knowledge_sources(count)
    `)
    .order("created_at", { ascending: false });
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    business_name: b.business_name ?? null,
    isActive: b.is_active,
    language: b.language,
    organization: b.organization ? { id: b.organization.id, name: b.organization.name } : null,
    sourceCount: b.sources?.[0]?.count ?? 0,
    createdAt: b.created_at,
  }));
}
