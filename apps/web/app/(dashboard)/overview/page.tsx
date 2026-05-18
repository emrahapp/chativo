import Link from "next/link";
import { Bot, MessagesSquare, Users, Sparkles, Plus, ArrowRight, CheckCircle2, Code2 } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getOverviewSnapshot } from "@/lib/dashboard/overview-data";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Overview" };

function timeAgoTr(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default async function OverviewPage() {
  const session = await requireSession();
  const data = await getOverviewSnapshot(session.organizationId);
  const limits = PLAN_LIMITS[session.planId];
  const messageDelta = limits.monthlyMessageLimit
    ? Math.round((data.monthlyMessages / limits.monthlyMessageLimit) * 100)
    : 0;

  const hasContent = data.totalChatbots > 0;

  return (
    <>
      <PageHeader
        title={`Hoş geldin, ${(session.name ?? session.email.split("@")[0])} 👋`}
        description="İşletmen için yapay zekâ asistanını yönet ve performansını izle."
        actions={
          <Button asChild>
            <Link href="/chatbots/new">
              <Plus className="h-4 w-4" />
              Yeni Chatbot
            </Link>
          </Button>
        }
      />

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Toplam Chatbot"
          value={data.totalChatbots}
          hint={`${limits.chatbotLimit - data.totalChatbots} bot daha ekleyebilirsin`}
          icon={<Bot className="h-4 w-4" />}
        />
        <KpiCard
          label="Bu Ay Mesaj"
          value={`${formatNumber(data.monthlyMessages)} / ${formatNumber(limits.monthlyMessageLimit)}`}
          delta={messageDelta > 100 ? 100 : null as unknown as number}
          hint={messageDelta >= 80 ? "Limitin yakınında — planı yükseltmeyi düşün." : "Limitler içinde."}
          icon={<Sparkles className="h-4 w-4" />}
          accent={messageDelta >= 80 ? "warning" : "default"}
        />
        <KpiCard
          label="Konuşma"
          value={formatNumber(data.totalConversations)}
          icon={<MessagesSquare className="h-4 w-4" />}
        />
        <KpiCard
          label="Lead"
          value={formatNumber(data.totalLeads)}
          icon={<Users className="h-4 w-4" />}
        />
      </section>

      {!hasContent ? (
        <div className="mt-8">
          <EmptyState
            icon={<Bot className="h-7 w-7" />}
            title="İlk chatbot'unu oluşturalım"
            description="Web siteni, dosyalarını veya SSS'lerini yükle. 5 dakikada işletmene özel asistanın hazır olsun."
            action={{ label: "Chatbot Oluştur", href: "/chatbots/new" }}
          />
        </div>
      ) : (
        <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Recent conversations */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle>Son Konuşmalar</CardTitle>
                <CardDescription>En son ziyaretçi mesajları.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/conversations">Tümünü gör <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentConversations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Henüz konuşma yok. Widget'ı sitene ekledikten sonra burada görünecek.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentConversations.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                          {c.botName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-foreground">
                          "{c.firstMessage}"
                        </p>
                      </div>
                      <Link
                        href={`/conversations/${c.conversationId}`}
                        className="shrink-0 text-xs font-medium text-muted-foreground hover:text-brand-600"
                      >
                        {timeAgoTr(c.createdAt)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Active bots + setup */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
              <CardTitle>Aktif Botlar</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/chatbots">Tümü <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ul className="space-y-2">
                {data.activeBots.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.sourceCount} kaynak</p>
                      </div>
                    </div>
                    <Badge variant={b.isActive ? "success" : "muted"}>
                      {b.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  <span className="font-semibold text-foreground">Widget Kurulum Durumu</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.setupProgress.completed} / {data.setupProgress.total} bot kaynaklarıyla hazır
                </p>
                <Progress
                  value={data.setupProgress.total
                    ? Math.round((data.setupProgress.completed / data.setupProgress.total) * 100)
                    : 0}
                  className="mt-3"
                />
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/chatbots">
                    <Code2 className="h-3.5 w-3.5" />
                    Kod Görüntüle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </>
  );
}
