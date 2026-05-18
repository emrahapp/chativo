import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Globe, Info } from "lucide-react";
import Script from "next/script";
import { getChatbot } from "@/lib/chatbots/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CopyButton } from "@/components/wizard/copy-button";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Widget Önizleme" };

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatbot = await getChatbot(id);
  if (!chatbot) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script src="${appUrl}/widget.js" data-chatbot-id="${chatbot.id}" async defer></script>`;

  return (
    <>
      <PageHeader
        title="Widget Önizleme"
        description="Sahte bir web sitesi üzerinde widget'ın gerçek davranışını gör."
        actions={
          <Link
            href={`/chatbots/${chatbot.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Bot detayına dön
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Fake "customer site" */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span className="font-mono">https://demo-site.example</span>
          </div>
          <div className="space-y-5 p-8">
            <div className="space-y-2">
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                E-ticaret · Demo
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Premium Mağaza
              </h2>
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                Bu sayfa, müşterinin sitesini taklit eden boş bir demo. Sağ alttaki sohbet
                balonu, bot'un canlı widget'ı — gerçek API'lere bağlı, gerçek RAG cevapları
                veriyor. Sohbet ettikçe konuşmalar Conversations ekranında, lead'ler ise
                Leads ekranında görünmeye başlar.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-secondary to-secondary/40" />
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Hakkımızda</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Bot'a kargo süreleri,
                iade politikası, ödeme seçenekleri veya yüklediğin kaynaklarda olan başka bir
                konuda soru sor.
              </p>
            </div>
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed kodu</CardTitle>
              <CardDescription>Bu kodu kendi sitenin {`<body>`} kapanışından önce ekle.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-xl border border-border bg-zinc-950 p-3">
                <pre className="overflow-x-auto pr-20 text-[11px] leading-relaxed text-zinc-100">
                  <code>{snippet}</code>
                </pre>
                <CopyButton
                  text={snippet}
                  className="absolute right-2 top-2 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  variant="outline"
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-2 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <div>
                  <p className="font-medium text-foreground">Bu sayfada widget gerçek</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Test playground'dan farklı olarak buradaki konuşmalar Conversations
                    ekranına kaydedilir ve aylık mesaj sayacına eklenir.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/chatbots/${chatbot.id}/playground`}>
                  Sayılmayan test için Playground
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inject the real widget script — this is what makes the chat bubble appear */}
      <Script
        id="chativo-widget"
        src={`${appUrl}/widget.js`}
        data-chatbot-id={chatbot.id}
        strategy="afterInteractive"
      />
    </>
  );
}
