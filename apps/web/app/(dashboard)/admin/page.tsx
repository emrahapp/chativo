import Link from "next/link";
import { Users, Building2, Bot, Database, MessagesSquare, UserPlus, Sparkles, AlertTriangle } from "lucide-react";
import { getAdminOverview } from "@/lib/admin/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Admin — Overview" };

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();
  return (
    <>
      <PageHeader
        title="Platform Overview"
        description="Tüm tenant'ların özet durumu."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Kullanıcı" value={formatNumber(data.totals.users)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Organizasyon" value={formatNumber(data.totals.organizations)} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Chatbot" value={formatNumber(data.totals.chatbots)} icon={<Bot className="h-4 w-4" />} />
        <KpiCard label="Kaynak" value={formatNumber(data.totals.sources)} icon={<Database className="h-4 w-4" />} />
        <KpiCard label="Konuşma" value={formatNumber(data.totals.conversations)} icon={<MessagesSquare className="h-4 w-4" />} />
        <KpiCard label="Lead" value={formatNumber(data.totals.leads)} icon={<UserPlus className="h-4 w-4" />} />
        <KpiCard
          label="Mesaj (30g)"
          value={formatNumber(data.totals.messages30d)}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan dağılımı</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {data.planDistribution.map((p) => (
                <div key={p.planId} className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{p.planId}</span>
                  <span className="font-mono font-semibold text-foreground">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>En çok mesaj kullanan organizasyonlar</CardTitle>
            <CardDescription>Son 30 gün.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topOrgs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Henüz kullanım yok.</p>
            ) : (
              <ul className="space-y-3">
                {data.topOrgs.map((o) => (
                  <li key={o.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/admin/organizations`}
                        className="min-w-0 truncate font-medium text-foreground hover:text-brand-600"
                      >
                        {o.name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={o.pct >= 80 ? "warning" : "muted"} className="capitalize">
                          {o.planId}
                        </Badge>
                        <span className="font-mono">
                          {formatNumber(o.messages)} / {formatNumber(o.monthlyLimit)}
                        </span>
                      </div>
                    </div>
                    <Progress value={o.pct} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hatalı kaynak işlemleri</CardTitle>
            <CardDescription>Ingest pipeline'da başarısız olanlar.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.failedSources.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Hata yok 🎉</p>
            ) : (
              <ul className="space-y-3">
                {data.failedSources.map((s) => (
                  <li key={s.id} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{s.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {s.organization?.name ?? "?"} · {s.type}
                        </p>
                        {s.error_message && (
                          <p className="mt-1 line-clamp-2 text-xs text-red-700">{s.error_message}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
