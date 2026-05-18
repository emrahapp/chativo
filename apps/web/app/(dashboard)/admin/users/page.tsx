import { requireAdminSession } from "@/lib/auth/get-session";
import { listAllUsers } from "@/lib/admin/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminToggle } from "@/components/admin/admin-toggle";
import { formatTimeAgoTr } from "@/lib/conversations/repo";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const me = await requireAdminSession();
  const users = await listAllUsers();
  return (
    <>
      <PageHeader title="Users" description={`${users.length} kullanıcı`} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Kullanıcı</th>
              <th className="px-4 py-3 text-left font-medium">Organizasyonlar</th>
              <th className="px-4 py-3 text-center font-medium">Dil</th>
              <th className="px-4 py-3 text-center font-medium">Admin</th>
              <th className="px-4 py-3 text-right font-medium">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isSelf = u.id === me.userId;
              return (
                <tr key={u.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name ?? u.email.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.organizations.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        u.organizations.map((o) => (
                          <Badge key={o.id} variant="muted" className="text-[10px]">
                            {o.name} · {o.role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs uppercase text-muted-foreground">{u.locale}</td>
                  <td className="px-4 py-3 text-center">
                    <AdminToggle userId={u.id} isAdmin={u.isAdmin} isSelf={isSelf} />
                    {isSelf && <p className="mt-0.5 text-[10px] text-muted-foreground">(sen)</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {formatTimeAgoTr(u.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
