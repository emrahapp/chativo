import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Chatbots" };

export default async function ChatbotsPage() {
  const session = await requireSession();
  const supabase = await getSupabaseServer();
  const { data: bots } = await supabase
    .from("chatbots")
    .select("id, name, business_name, language, is_active, created_at, sources:knowledge_sources(count)")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Chatbots"
        description="İşletmen için oluşturduğun yapay zekâ asistanları."
        actions={
          <Button asChild>
            <Link href="/chatbots/new"><Plus className="h-4 w-4" />Yeni Chatbot</Link>
          </Button>
        }
      />

      {(!bots || bots.length === 0) ? (
        <EmptyState
          icon={<Bot className="h-7 w-7" />}
          title="Henüz chatbot yok"
          description="İlk botunu oluştur, web sitenden ve dosyalarından eğit. 5 dakikada yayında olsun."
          action={{ label: "Chatbot Oluştur", href: "/chatbots/new" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((b) => {
            const sourceCount = ((b.sources as unknown as Array<{ count: number }> | null)?.[0]?.count) ?? 0;
            return (
              <Link key={b.id} href={`/chatbots/${b.id}`} className="group">
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-soft-lg">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                      <Badge variant={b.is_active ? "success" : "muted"}>
                        {b.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-brand-600">
                        {b.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.business_name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>{sourceCount} kaynak</span>
                      <span>·</span>
                      <span className="uppercase">{b.language}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
