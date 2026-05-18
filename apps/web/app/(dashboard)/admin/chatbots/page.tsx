import { Bot } from "lucide-react";
import { listAllChatbots } from "@/lib/admin/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { BotActiveToggle } from "@/components/admin/bot-active-toggle";
import { formatTimeAgoTr } from "@/lib/conversations/repo";

export const metadata = { title: "Admin — Chatbots" };

export default async function AdminChatbotsPage() {
  const bots = await listAllChatbots();
  return (
    <>
      <PageHeader title="Chatbots" description={`Tüm tenant'lardaki ${bots.length} chatbot`} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Bot</th>
              <th className="px-4 py-3 text-left font-medium">Organizasyon</th>
              <th className="px-4 py-3 text-center font-medium">Dil</th>
              <th className="px-4 py-3 text-right font-medium">Kaynak</th>
              <th className="px-4 py-3 text-center font-medium">Aktif</th>
              <th className="px-4 py-3 text-right font-medium">Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bots.map((b) => (
              <tr key={b.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground">{b.business_name ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.organization?.name ?? "—"}</td>
                <td className="px-4 py-3 text-center text-xs uppercase text-muted-foreground">{b.language}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{b.sourceCount}</td>
                <td className="px-4 py-3 text-center">
                  <BotActiveToggle chatbotId={b.id} isActive={b.isActive} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {formatTimeAgoTr(b.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
