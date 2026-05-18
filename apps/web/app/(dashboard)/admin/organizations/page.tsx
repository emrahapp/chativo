import { listAllOrganizations } from "@/lib/admin/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { PlanSelect } from "@/components/admin/plan-select";
import { formatNumber } from "@/lib/utils";
import { formatTimeAgoTr } from "@/lib/conversations/repo";

export const metadata = { title: "Admin — Organizations" };

export default async function AdminOrgsPage() {
  const orgs = await listAllOrganizations();
  return (
    <>
      <PageHeader title="Organizations" description={`${orgs.length} organizasyon`} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Ad</th>
              <th className="px-4 py-3 text-left font-medium">Sahip</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-right font-medium">Üye</th>
              <th className="px-4 py-3 text-right font-medium">Bot</th>
              <th className="px-4 py-3 text-right font-medium">Mesaj (30g)</th>
              <th className="px-4 py-3 text-right font-medium">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{o.name}</p>
                  <p className="text-[11px] text-muted-foreground">{o.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.ownerEmail ?? "—"}</td>
                <td className="px-4 py-3">
                  <PlanSelect organizationId={o.id} current={o.planId} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{o.memberCount}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{o.chatbotCount}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {formatNumber(o.monthlyMessages)} / {formatNumber(o.monthlyLimit)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {formatTimeAgoTr(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
