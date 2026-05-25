import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { PlanCard } from "./plan-card";
import { UserCard } from "./user-card";
import type { SessionContext } from "@/lib/auth/get-session";
import type { PlanLimits } from "@chativo/shared";

const NAV: NavItem[] = [
  { href: "/overview",      label: "Overview",      icon: "overview" },
  { href: "/chatbots",      label: "Chatbots",      icon: "chatbots" },
  { href: "/knowledge",     label: "Knowledge Base",icon: "knowledge" },
  { href: "/conversations", label: "Conversations", icon: "conversations" },
  { href: "/leads",         label: "Leads",         icon: "leads" },
  { href: "/analytics",     label: "Analytics",     icon: "analytics" },
  { href: "/settings",      label: "Settings",      icon: "settings" },
  { href: "/billing",       label: "Billing",       icon: "billing" },
];

export function DashboardSidebar({
  session,
  usage,
  planLimits,
}: {
  session: SessionContext;
  usage: { messagesThisMonth: number };
  planLimits: PlanLimits;
}) {
  const items: NavItem[] = [...NAV];
  if (session.isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: "admin" });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-white lg:flex">
      {/* Logo */}
      <div className="px-6 pt-5 pb-4">
        <Link href="/overview">
          <Logo variant="dark" />
        </Link>
      </div>

      {/* Profile mini-card (Link tarzı) */}
      <UserCard
        name={session.name ?? session.email.split("@")[0]!}
        email={session.email}
        avatarUrl={session.avatarUrl}
      />

      {/* Nav */}
      <div className="mt-2 flex-1 overflow-y-auto py-2">
        <SidebarNav items={items} />
      </div>

      {/* Plan card */}
      <div className="px-3 pb-3">
        <PlanCard
          planName={session.planId.charAt(0).toUpperCase() + session.planId.slice(1)}
          used={usage.messagesThisMonth}
          limit={planLimits.monthlyMessageLimit}
          isUpgradeable={session.planId !== "agency"}
        />
      </div>

      {/* Footer help + legal — Link tarzı */}
      <div className="border-t border-border px-6 py-4">
        <div className="text-center">
          <Link href="/support" className="inline-block rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70">
            Help
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/kvkk" className="hover:text-foreground">KVKK</Link>
        </div>
      </div>
    </aside>
  );
}
