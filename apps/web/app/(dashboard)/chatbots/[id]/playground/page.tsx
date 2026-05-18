import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getChatbot } from "@/lib/chatbots/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { ChatPanel } from "@/components/playground/chat-panel";

export const metadata = { title: "Playground" };

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatbot = await getChatbot(id);
  if (!chatbot) notFound();

  return (
    <>
      <PageHeader
        title={`${chatbot.name} · Playground`}
        description="Botu canlı yayındaki gibi test et. Mesajlar konuşma kayıtlarına yazılmaz."
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
      <ChatPanel chatbot={chatbot} variant="fullscreen" />
    </>
  );
}
