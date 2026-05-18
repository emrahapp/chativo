import { ShieldCheck } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/get-session";
import { AdminSubnav } from "@/components/dashboard/admin-subnav";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();   // 404 if not admin
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminSubnav />
        <Badge variant="default">
          <ShieldCheck className="h-3 w-3" />
          Admin paneli
        </Badge>
      </div>
      {children}
    </div>
  );
}
