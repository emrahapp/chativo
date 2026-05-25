import { requireSession } from "@/lib/auth/get-session";
import { getMonthlyMessageCount } from "@/lib/usage/monthly";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // session is wrapped in React cache() — children calling requireSession() reuse it
  const session = await requireSession();
  const used = await getMonthlyMessageCount(session.organizationId);
  const planLimits = PLAN_LIMITS[session.planId];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        session={session}
        usage={{ messagesThisMonth: used }}
        planLimits={planLimits}
      />
      <div className="lg:pl-64">
        <DashboardTopbar />
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
