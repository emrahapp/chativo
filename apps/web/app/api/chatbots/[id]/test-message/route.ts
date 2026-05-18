import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/get-session";
import { getChatbot } from "@/lib/chatbots/repo";
import { runRagChat, type ChatTurn } from "@/lib/llm/chat-rag";

export const runtime = "nodejs";        // pgvector + Node-only deps
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .max(20)
    .optional(),
  locale: z.enum(["tr", "en"]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  // RLS check: only members of the chatbot's org can hit this endpoint.
  const chatbot = await getChatbot(id);
  if (!chatbot || chatbot.organization_id !== session.organizationId) {
    return new Response("Not found", { status: 404 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  const encoder = new TextEncoder();
  const history = (body.history ?? []) as ChatTurn[];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runRagChat({
          chatbot,
          userMessage: body.message,
          history,
          locale: body.locale,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          if (event.type === "done" || event.type === "error") break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
