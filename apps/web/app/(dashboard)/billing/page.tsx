import Link from "next/link";
import { Check, ExternalLink, AlertCircle } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import { isStripeConfigured } from "@/lib/stripe/client";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing" };

const planMeta = [
  { id: "free",    label: "Free",    priceTry: "₺0",      highlight: false },
  { id: "starter", label: "Starter", priceTry: "₺499",    highlight: false },
  { id: "pro",     label: "Pro",     priceTry: "₺1.299",  highlight: true  },
  { id: "agency",  label: "Agency",  priceTry: "₺3.999",  highlight: false },
] as const;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const session = await requireSession();
  const { canceled } = await searchParams;
  const stripeOn = isStripeConfigured();

  const admin = getSupabaseAdmin();
  const { data: org } = await admin
    .from("organizations")
    .select("stripe_customer_id, subscription_status, current_period_end")
    .eq("id", session.organizationId)
    .single();

  const hasSub = !!org?.stripe_customer_id;
  const status = (org?.subscription_status ?? null) as string | null;
  const periodEnd = (org?.current_period_end ?? null) as string | null;

  return (
    <>
      <PageHeader
        title="Billing"
        description="Mevcut planını gör ve dilediğin zaman yükselt."
        actions={
          hasSub && stripeOn ? (
            <Button asChild variant="outline">
              <a href="/api/billing/portal">
                Aboneliği yönet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null
        }
      />

      {canceled && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Ödeme iptal edildi. Plan değişmedi.
        </div>
      )}

      {!stripeOn && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Stripe henüz yapılandırılmadı (env vars eksik). Plan yükseltme şu an pasif.
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Mevcut Plan</CardTitle>
              <CardDescription>
                {status === "past_due"
                  ? "Ödeme alınamadı. Aboneliği yönet'ten kartını güncelle."
                  : status === "active"
                  ? `Aktif. Sonraki yenileme: ${periodEnd ? new Date(periodEnd).toLocaleDateString("tr-TR") : "—"}`
                  : "Aktif aboneliğin yok. Aşağıdan bir plan seç."}
              </CardDescription>
            </div>
            <Badge variant={status === "past_due" ? "warning" : "default"} className="capitalize">
              {session.planId}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <Stat label="Aylık mesaj" value={PLAN_LIMITS[session.planId].monthlyMessageLimit.toLocaleString("tr-TR")} />
          <Stat label="Chatbot limiti" value={PLAN_LIMITS[session.planId].chatbotLimit.toString()} />
          <Stat label="Kaynak limiti" value={PLAN_LIMITS[session.planId].sourceLimit.toString()} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {planMeta.map((p) => {
          const limits = PLAN_LIMITS[p.id];
          const isCurrent = session.planId === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "relative",
                p.highlight && "border-brand-500 ring-1 ring-brand-500 shadow-glow"
              )}
            >
              <CardContent className="space-y-4 p-6">
                {p.highlight && (
                  <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2">
                    En popüler
                  </Badge>
                )}
                <p className="font-semibold text-foreground">{p.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{p.priceTry}</span>
                  <span className="text-sm text-muted-foreground">/ ay</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground">
                  <Li>{limits.monthlyMessageLimit.toLocaleString("tr-TR")} mesaj/ay</Li>
                  <Li>{limits.chatbotLimit} chatbot</Li>
                  <Li>{limits.sourceLimit} kaynak</Li>
                  {limits.removeBranding && <Li>Branding kaldır</Li>}
                  {limits.whiteLabel && <Li>White-label</Li>}
                </ul>
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">Mevcut plan</Button>
                ) : p.id === "free" ? (
                  hasSub && stripeOn ? (
                    <Button asChild variant="outline" className="w-full">
                      <a href="/api/billing/portal">Aboneliği iptal et</a>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full">Ücretsiz</Button>
                  )
                ) : (
                  <UpgradeButton
                    planId={p.id}
                    className="w-full"
                    variant={p.highlight ? "default" : "outline"}
                  >
                    Yükselt
                  </UpgradeButton>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Tüm fiyatlar KDV hariç. Ödeme Stripe üzerinden güvenle alınır. TR ödeme (iyzico, PayTR) bir sonraki sürümde.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <span>{children}</span>
    </li>
  );
}
