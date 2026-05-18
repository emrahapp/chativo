import { notFound } from "next/navigation";
import Link from "next/link";
import { Bot, Database, MessagesSquare, Users, Code2, Settings, Sparkles } from "lucide-react";
import { getChatbot, countSources } from "@/lib/chatbots/repo";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChatbotActiveToggle } from "@/components/dashboard/chatbot-active-toggle";
import { LivePreview } from "@/components/wizard/live-preview";
import { CopyButton } from "@/components/wizard/copy-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ChatbotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatbot = await getChatbot(id);
  if (!chatbot) notFound();

  const supabase = await getSupabaseServer();
  const [sourceCount, { count: convoCount }, { count: leadCount }] = await Promise.all([
    countSources(chatbot.id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("chatbot_id", chatbot.id),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("chatbot_id", chatbot.id),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script src="${appUrl}/widget.js" data-chatbot-id="${chatbot.id}" async defer></script>`;

  return (
    <>
      <PageHeader
        title={chatbot.name}
        description={chatbot.business_name ?? "—"}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ChatbotActiveToggle chatbotId={chatbot.id} isActive={chatbot.is_active} />
            <Button asChild variant="outline">
              <Link href={`/chatbots/${chatbot.id}/playground`}>
                <Sparkles className="h-4 w-4" />
                Test Et
              </Link>
            </Button>
            <Button asChild variant="gradient">
              <Link href={`/chatbots/${chatbot.id}/preview`}>
                <Code2 className="h-4 w-4" />
                Widget Önizleme
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/chatbots/${chatbot.id}/setup?step=sources`}>
                <Settings className="h-4 w-4" />
                Düzenle
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <section className="grid gap-3 sm:grid-cols-4">
        <Stat icon={<Database className="h-4 w-4" />} label="Kaynak" value={sourceCount} />
        <Stat icon={<MessagesSquare className="h-4 w-4" />} label="Konuşma" value={convoCount ?? 0} />
        <Stat icon={<Users className="h-4 w-4" />} label="Lead" value={leadCount ?? 0} />
        <Stat icon={<Bot className="h-4 w-4" />} label="Dil" value={chatbot.language.toUpperCase()} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Embed code */}
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Embed kodu</CardTitle>
                <CardDescription>Sitenin <code className="font-mono text-xs">&lt;/body&gt;</code> kapanışından önce ekle.</CardDescription>
              </div>
              <Badge variant={chatbot.is_active ? "success" : "muted"}>
                {chatbot.is_active ? "Aktif" : "Pasif"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-xl border border-border bg-zinc-950 p-4">
                <pre className="overflow-x-auto pr-20 text-xs leading-relaxed text-zinc-100">
                  <code>{snippet}</code>
                </pre>
                <CopyButton
                  text={snippet}
                  className="absolute right-3 top-3 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı erişim</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <QuickLink
                href={`/chatbots/${chatbot.id}/setup?step=sources`}
                icon={<Database className="h-4 w-4" />}
                title="Veri Kaynakları"
                desc={`${sourceCount} kaynak yüklendi`}
              />
              <QuickLink
                href={`/chatbots/${chatbot.id}/setup?step=behavior`}
                icon={<Sparkles className="h-4 w-4" />}
                title="Davranış"
                desc={`Ton: ${chatbot.tone} · ${chatbot.answer_length}`}
              />
              <QuickLink
                href={`/chatbots/${chatbot.id}/setup?step=appearance`}
                icon={<Code2 className="h-4 w-4" />}
                title="Görünüm"
                desc={chatbot.primary_color.toUpperCase()}
              />
              <QuickLink
                href={`/chatbots/${chatbot.id}/setup?step=test`}
                icon={<Bot className="h-4 w-4" />}
                title="Test Et"
                desc="Botu canlı dene"
              />
            </CardContent>
          </Card>
        </div>

        <LivePreview
          config={{
            botName: chatbot.name,
            primaryColor: chatbot.primary_color,
            welcomeMessage: chatbot.welcome_message ?? "Merhaba 👋 Size nasıl yardımcı olabilirim?",
            quickQuestions: chatbot.quick_questions ?? [],
            theme: chatbot.theme,
          }}
        />
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-all hover:border-brand-200 hover:bg-secondary/50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
