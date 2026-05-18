import Link from "next/link";
import { Users, Download, Mail, Phone } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { listLeadsForOrg } from "@/lib/leads/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTimeAgoTr } from "@/lib/conversations/repo";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const session = await requireSession();
  const leads = await listLeadsForOrg(session.organizationId);

  if (leads.length === 0) {
    return (
      <>
        <PageHeader
          title="Leads"
          description="Bot ile etkileşime giren ziyaretçilerden topladığın iletişim bilgileri."
        />
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Henüz lead yok"
          description="Bot cevap bulamadığında veya kullanıcı iletişim istediğinde widget'ta lead formu açılır."
          action={{ label: "Chatbot Oluştur", href: "/chatbots/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} lead toplandı.`}
        actions={
          <Button asChild variant="outline">
            <a href="/api/leads/export" download>
              <Download className="h-4 w-4" />
              CSV İndir
            </a>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">İletişim</th>
              <th className="px-4 py-3 text-left font-medium">Şirket</th>
              <th className="px-4 py-3 text-left font-medium">Bot</th>
              <th className="px-4 py-3 text-left font-medium">Mesaj</th>
              <th className="px-4 py-3 text-right font-medium">Tarih</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{l.name ?? "—"}</p>
                    <div className="mt-0.5 flex flex-col gap-0.5 text-xs">
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-brand-600">
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </a>
                      )}
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-brand-600">
                          <Phone className="h-3 w-3" />
                          {l.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.company ?? "—"}</td>
                <td className="px-4 py-3">
                  {l.bot ? (
                    <Link href={`/chatbots/${l.bot.id}`} className="text-sm font-medium text-foreground hover:text-brand-600">
                      {l.bot.name}
                    </Link>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="line-clamp-1 max-w-[260px] text-sm text-muted-foreground">
                    {l.message ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {formatTimeAgoTr(l.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  {l.conversation_id && (
                    <Link href={`/conversations/${l.conversation_id}`} className="text-xs font-medium text-brand-600 hover:underline">
                      Konuşma
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
