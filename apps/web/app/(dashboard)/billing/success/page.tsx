import Link from "next/link";
import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Ödeme Başarılı" };

/**
 * Stripe checkout success landing page.
 * The actual plan upgrade happens server-side via webhook — we just confirm here.
 * Webhook usually fires within a second or two of Stripe redirect, but to be safe
 * we tell the user the change may take a moment.
 */
export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await requireSession();
  await searchParams;

  return (
    <>
      <PageHeader title="Ödeme tamamlandı 🎉" description="Teşekkürler — yeni planın aktif edildi." />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Plan güncellemen kuyruğa alındı</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Stripe'tan dönüş alındı. Plan limitlerinin güncellenmesi birkaç saniye sürebilir
              (Stripe webhook'u backend'i tetikledikten sonra). Sayfayı yenilemen yeterli.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/overview">
                Dashboard'a git
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/billing/portal">
                Aboneliği yönet
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="pt-3 text-xs text-muted-foreground">
            Faturanı / makbuzunu Stripe Customer Portal'dan indirebilirsin. Mevcut plan: <strong className="font-semibold text-foreground capitalize">{session.planId}</strong>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
