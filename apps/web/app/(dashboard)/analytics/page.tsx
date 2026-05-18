import { BarChart3, MessagesSquare, Users, Sparkles, Percent } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getAnalyticsSnapshot } from "@/lib/analytics/data";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  DailyMessagesChart,
  PerBotChart,
  RatingDonut,
} from "@/components/analytics/charts";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await requireSession();
  const data = await getAnalyticsSnapshot(session.organizationId);

  const empty = data.totals.messages === 0 && data.totals.conversations === 0;

  if (empty) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Botların performansını izle ve iyileştirme fırsatlarını gör."
        />
        <EmptyState
          icon={<BarChart3 className="h-7 w-7" />}
          title="Veri toplanmaya başladığında..."
          description="Widget üzerinden ilk konuşmalar olduktan sonra mesaj kullanımı, lead dönüşümü ve memnuniyet skorları burada grafiklerle görünecek."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Son 30 günün özeti."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Mesaj (30g)"
          value={formatNumber(data.totals.messages)}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <KpiCard
          label="Konuşma (30g)"
          value={formatNumber(data.totals.conversations)}
          icon={<MessagesSquare className="h-4 w-4" />}
        />
        <KpiCard
          label="Lead (30g)"
          value={formatNumber(data.totals.leads)}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Lead Dönüşüm"
          value={`${(data.totals.leadRate * 100).toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mesaj kullanımı</CardTitle>
            <CardDescription>Son 30 günlük günlük mesaj sayısı.</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyMessagesChart data={data.dailyMessages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memnuniyet</CardTitle>
            <CardDescription>Ziyaretçi cevapları için verdiği oylar.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.ratings.positive + data.ratings.negative + data.ratings.none > 0 ? (
              <RatingDonut {...data.ratings} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Henüz oy yok.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bot bazlı kullanım</CardTitle>
            <CardDescription>Hangi botun ne kadar mesaj aldığı.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.perBot.length > 0 ? (
              <PerBotChart data={data.perBot} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Henüz bot bazlı veri yok.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
