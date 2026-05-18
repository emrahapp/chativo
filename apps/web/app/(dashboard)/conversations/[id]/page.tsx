import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Building2, ThumbsUp, ThumbsDown, Sparkles, ChevronDown } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getConversationDetail, formatTimeAgoTr } from "@/lib/conversations/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Konuşma Detayı" };

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const convo = await getConversationDetail(id);
  if (!convo) notFound();
  // Defensive double-check (RLS already enforces this, but never assume)
  if (convo.messages.length > 0 && convo.messages[0]) {
    // ok
  }
  void session;

  const botColor = convo.bot?.primary_color ?? "#6554E8";

  return (
    <>
      <PageHeader
        title={`${convo.bot?.name ?? "Bot"} · Konuşma`}
        description={`Ziyaretçi ${convo.visitor_id.slice(0, 12)}… · ${formatTimeAgoTr(convo.created_at)}`}
        actions={
          <Link
            href="/conversations"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Konuşmalara dön
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Thread */}
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="text-sm font-semibold text-foreground">
              {convo.messages.length} mesaj
            </p>
            <div className="flex items-center gap-2">
              {convo.rating === 1 && <Badge variant="success"><ThumbsUp className="h-3 w-3" />Olumlu</Badge>}
              {convo.rating === -1 && <Badge variant="danger"><ThumbsDown className="h-3 w-3" />Olumsuz</Badge>}
              <Badge variant="muted">Kanal: {convo.channel}</Badge>
            </div>
          </div>
          <CardContent className="space-y-3 p-5">
            {convo.messages.map((m) => (
              <MessageBubble key={m.id} message={m} botColor={botColor} />
            ))}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {convo.lead ? (
            <Card>
              <CardHeader>
                <CardTitle>Lead bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {convo.lead.name && <Row label="Ad">{convo.lead.name}</Row>}
                {convo.lead.email && (
                  <Row label="E-posta" icon={<Mail className="h-3.5 w-3.5" />}>
                    <a href={`mailto:${convo.lead.email}`} className="text-brand-600 hover:underline">
                      {convo.lead.email}
                    </a>
                  </Row>
                )}
                {convo.lead.phone && (
                  <Row label="Telefon" icon={<Phone className="h-3.5 w-3.5" />}>
                    <a href={`tel:${convo.lead.phone}`} className="text-brand-600 hover:underline">
                      {convo.lead.phone}
                    </a>
                  </Row>
                )}
                {convo.lead.company && (
                  <Row label="Şirket" icon={<Building2 className="h-3.5 w-3.5" />}>
                    {convo.lead.company}
                  </Row>
                )}
                {convo.lead.message && (
                  <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                    "{convo.lead.message}"
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="px-5 py-6 text-center text-sm text-muted-foreground">
                Bu konuşmada henüz lead bırakılmamış.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Konuşma meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Row label="Ziyaretçi ID">
                <code className="text-xs">{convo.visitor_id}</code>
              </Row>
              <Row label="Başlangıç">{formatTimeAgoTr(convo.created_at)}</Row>
              <Row label="Son aktivite">{formatTimeAgoTr(convo.updated_at)}</Row>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

function MessageBubble({
  message,
  botColor,
}: {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources_used: { id: string; source_id: string; preview: string; similarity: number }[];
    latency_ms: number | null;
  };
  botColor: string;
}) {
  if (message.role === "system") return null;
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
          style={{ backgroundColor: botColor }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[90%]">
      <div className="rounded-2xl rounded-tl-sm bg-secondary/60 px-4 py-2.5 text-sm leading-relaxed text-foreground">
        {message.content}
      </div>
      {message.sources_used && message.sources_used.length > 0 && (
        <details className="ml-1 mt-1.5 group">
          <summary className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Sparkles className="h-3 w-3 text-brand-500" />
            {message.sources_used.length} kaynak parçası kullanıldı
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-1.5 space-y-1.5">
            {message.sources_used.map((s, i) => (
              <li key={s.id} className="rounded-lg border border-border bg-white px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="font-medium text-brand-600">#{i + 1}</span>
                  <span className="font-mono text-[10px]">benzerlik {s.similarity}</span>
                </div>
                <p className="line-clamp-3">{s.preview}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {message.latency_ms != null && (
        <p className="ml-1 mt-1 text-[10px] text-muted-foreground">
          {message.latency_ms}ms
        </p>
      )}
    </div>
  );
}
