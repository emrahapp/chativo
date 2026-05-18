import Link from "next/link";
import { Globe, MessageSquareText, BookOpen, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UrlSourceForm, ManualSourceForm, FaqSourceForm } from "@/components/sources/source-forms";
import { FileUploadForm } from "@/components/sources/file-upload-form";
import { SourceList } from "@/components/sources/source-list";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/get-session";
import { PLAN_LIMITS } from "@/lib/plans/limits";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

export async function StepSources({ chatbot }: { chatbot: ChatbotRecord }) {
  const session = await requireSession();
  const maxMb = PLAN_LIMITS[session.planId].fileSizeLimitMb;
  const supabase = await getSupabaseServer();
  const { data: sources } = await supabase
    .from("knowledge_sources")
    .select("id, type, title, source_url, status, chunk_count, error_message, created_at")
    .eq("chatbot_id", chatbot.id)
    .order("created_at", { ascending: false });

  const list = (sources ?? []) as unknown as Array<{
    id: string; type: string; title: string; source_url: string | null;
    status: "pending" | "processing" | "completed" | "failed";
    chunk_count: number; error_message: string | null; created_at: string;
  }>;

  const hasAtLeastOne = list.length > 0;
  const hasCompleted = list.some((s) => s.status === "completed");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="url">
        <TabsList>
          <TabsTrigger value="url"><Globe className="h-3.5 w-3.5" />URL</TabsTrigger>
          <TabsTrigger value="manual"><MessageSquareText className="h-3.5 w-3.5" />Manuel Metin</TabsTrigger>
          <TabsTrigger value="faq"><BookOpen className="h-3.5 w-3.5" />SSS</TabsTrigger>
          <TabsTrigger value="file"><FileText className="h-3.5 w-3.5" />Dosya</TabsTrigger>
        </TabsList>

        <TabsContent value="url"><UrlSourceForm chatbotId={chatbot.id} /></TabsContent>
        <TabsContent value="manual"><ManualSourceForm chatbotId={chatbot.id} /></TabsContent>
        <TabsContent value="faq"><FaqSourceForm chatbotId={chatbot.id} /></TabsContent>
        <TabsContent value="file">
          <FileUploadForm chatbotId={chatbot.id} maxMb={maxMb} />
        </TabsContent>
      </Tabs>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Eklenen Kaynaklar {list.length ? `(${list.length})` : ""}
        </h3>
        <SourceList sources={list} />
      </div>

      {!hasAtLeastOne && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">En az bir kaynak ekle</p>
            <p className="mt-1">Bot, kaynak olmadan cevap veremez. Şimdilik bir URL veya birkaç SSS ekle, sonra Davranış adımına geç.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button asChild variant="ghost">
          <Link href="/chatbots/new">Geri</Link>
        </Button>
        <Button asChild variant={hasCompleted ? "gradient" : "outline"}>
          <Link href={`/chatbots/${chatbot.id}/setup?step=behavior`}>
            {hasCompleted ? "Davranışa Geç" : "Atla ve Devam Et"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
