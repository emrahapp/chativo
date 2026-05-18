import Link from "next/link";
import { MessagesSquare, ThumbsUp, ThumbsDown, ChevronRight, UserPlus } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { listConversationsForOrg, formatTimeAgoTr } from "@/lib/conversations/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Conversations" };

export default async function ConversationsPage() {
  const session = await requireSession();
  const rows = await listConversationsForOrg(session.organizationId);

  if (rows.length === 0) {
    return (
      <>
        <PageHeader
          title="Conversations"
          description="Botların ile yapılan tüm ziyaretçi konuşmaları."
        />
        <EmptyState
          icon={<MessagesSquare className="h-7 w-7" />}
          title="Henüz konuşma yok"
          description="Widget'ı sitene ekledikten veya Widget Önizleme'den deneme yaptıktan sonra konuşmalar burada görünür."
          action={{ label: "Chatbot Oluştur", href: "/chatbots/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Conversations"
        description={`${rows.length} konuşma — ziyaretçilerin botunla nasıl etkileşim kurduğunu izle.`}
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Ziyaretçi · İlk mesaj</th>
              <th className="px-4 py-3 text-left font-medium">Bot</th>
              <th className="px-4 py-3 text-left font-medium">Lead</th>
              <th className="px-4 py-3 text-center font-medium">Memnuniyet</th>
              <th className="px-4 py-3 text-right font-medium">Mesaj</th>
              <th className="px-4 py-3 text-right font-medium">Tarih</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="group hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link href={`/conversations/${r.id}`} className="block min-w-0">
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {r.visitor_id.slice(0, 10)}…
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm font-medium text-foreground group-hover:text-brand-600">
                      {r.first_message ?? "—"}
                    </p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.bot ? (
                    <Link href={`/chatbots/${r.bot.id}`} className="text-sm font-medium text-foreground hover:text-brand-600">
                      {r.bot.name}
                    </Link>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  {r.lead ? (
                    <Badge variant="success">
                      <UserPlus className="h-3 w-3" />
                      {r.lead.name || r.lead.email || "Lead"}
                    </Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <RatingPill rating={r.rating} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                  {r.message_count}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {formatTimeAgoTr(r.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/conversations/${r.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Detay"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function RatingPill({ rating }: { rating: number | null }) {
  if (rating === 1) {
    return (
      <Badge variant="success">
        <ThumbsUp className="h-3 w-3" />
        Olumlu
      </Badge>
    );
  }
  if (rating === -1) {
    return (
      <Badge variant="danger">
        <ThumbsDown className="h-3 w-3" />
        Olumsuz
      </Badge>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
