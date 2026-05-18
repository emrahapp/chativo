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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Logo */}
      <div className="px-6 pb-2 pt-5">
        <Link href="/overview">
          <Logo variant="light" />
        </Link>
      </div>

      {/* Nav */}
      <div className="mt-4 flex-1 overflow-y-auto pb-4">
        <SidebarNav items={items} />
      </div>

      {/* Plan card */}
      <div className="pb-3">
        <PlanCard
          planName={session.planId.charAt(0).toUpperCase() + session.planId.slice(1)}
          used={usage.messagesThisMonth}
          limit={planLimits.monthlyMessageLimit}
          isUpgradeable={session.planId !== "agency"}
        />
      </div>

      {/* User card */}
      <div className="border-t border-sidebar-border pb-4 pt-4">
        <UserCard
          name={session.name ?? session.email.split("@")[0]!}
          email={session.email}
          avatarUrl={session.avatarUrl}
        />
      </div>
    </aside>
  );
}
