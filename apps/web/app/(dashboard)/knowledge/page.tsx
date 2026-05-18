import Link from "next/link";
import { Database, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/get-session";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SourceList } from "@/components/sources/source-list";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Knowledge Base" };

export default async function KnowledgePage() {
  const session = await requireSession();
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from("knowledge_sources")
    .select("id, type, title, source_url, status, chunk_count, error_message, created_at, chatbot:chatbots(id, name)")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    source_url: r.source_url as string | null,
    status: r.status as "pending" | "processing" | "completed" | "failed",
    chunk_count: (r.chunk_count as number) ?? 0,
    error_message: r.error_message as string | null,
    created_at: r.created_at as string,
    botName: ((r.chatbot as unknown as { name: string } | null)?.name) ?? "—",
  }));

  if (rows.length === 0) {
    return (
      <>
        <PageHeader
          title="Knowledge Base"
          description="Tüm botlarının veri kaynaklarını tek yerden yönet."
        />
        <EmptyState
          icon={<Database className="h-7 w-7" />}
          title="Henüz veri kaynağı yok"
          description="Önce bir chatbot oluştur, sonra kurulum sırasında URL, manuel metin veya SSS ekle."
          action={{ label: "Chatbot Oluştur", href: "/chatbots/new" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description={`${rows.length} kaynak — tüm botlarındaki bilgi parçaları.`}
        actions={
          <Button asChild>
            <Link href="/chatbots"><Plus className="h-4 w-4" />Kaynak ekle</Link>
          </Button>
        }
      />
      <SourceList sources={rows} showBotColumn />
    </>
  );
}
