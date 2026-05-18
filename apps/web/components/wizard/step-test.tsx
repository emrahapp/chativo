import Link from "next/link";
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/playground/chat-panel";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

export async function StepTest({ chatbot }: { chatbot: ChatbotRecord }) {
  const supabase = await getSupabaseServer();
  const { count } = await supabase
    .from("knowledge_chunks")
    .select("id", { count: "exact", head: true })
    .eq("chatbot_id", chatbot.id);

  const hasKnowledge = (count ?? 0) > 0;

  return (
    <div className="space-y-6">
      {!hasKnowledge && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Bilgi tabanı boş</p>
            <p className="mt-1">
              Bot cevap üretebilir ama tüm sorulara fallback ile yanıt verecek. Test için önce{" "}
              <Link href={`/chatbots/${chatbot.id}/setup?step=sources`} className="font-medium underline">
                bir kaynak ekle
              </Link>.
            </p>
          </div>
        </div>
      )}

      <ChatPanel chatbot={chatbot} />

      <div className="flex items-center justify-between pt-2">
        <Button asChild variant="ghost">
          <Link href={`/chatbots/${chatbot.id}/setup?step=appearance`}>
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Link>
        </Button>
        <Button asChild variant="gradient" size="lg">
          <Link href={`/chatbots/${chatbot.id}/setup?step=publish`}>
            Yayına Al
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
