import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadWidgetChatbot, corsHeaders } from "@/lib/widget/auth-widget";
import { checkRate, clientIpFromHeaders } from "@/lib/widget/rate-limit";
import { runRagChat, type ChatTurn } from "@/lib/llm/chat-rag";
import { getUsageState, incrementUsage } from "@/lib/usage/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  visitorId: z.string().min(1).max(100),
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["tr", "en"]).optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const origin = req.headers.get("origin");
  const { chatbotId } = await params;

  // ── Load chatbot + check origin
  const auth = await loadWidgetChatbot(chatbotId, origin);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status, headers: corsHeaders(origin) });
  }
  const chatbot = auth.chatbot;

  // ── Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400, headers: corsHeaders(origin) });
  }

  // ── Rate limit (per IP + per visitor)
  const ip = clientIpFromHeaders(req.headers);
  const ipLimit = checkRate({
    namespace: "msg-ip",
    key: `${chatbotId}:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!ipLimit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: corsHeaders(origin) }
    );
  }
  const visitorLimit = checkRate({
    namespace: "msg-visitor",
    key: `${chatbotId}:${body.visitorId}`,
    limit: 200,
    windowMs: 60 * 60_000,
  });
  if (!visitorLimit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  // ── Plan limit
  const usage = await getUsageState(chatbot.organization_id);
  if (usage.exceeded) {
    return Response.json(
      { error: "plan_limit_exceeded" },
      { status: 402, headers: corsHeaders(origin) }
    );
  }

  // ── Get-or-create conversation + load short history
  const admin = getSupabaseAdmin();
  let conversationId = body.conversationId ?? null;
  const history: ChatTurn[] = [];

  if (conversationId) {
    const { data } = await admin
      .from("conversations")
      .select("id, chatbot_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!data || data.chatbot_id !== chatbot.id) {
      // Foreign conversation id — start a new one
      conversationId = null;
    } else {
      const { data: msgs } = await admin
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(12);
      for (const m of msgs ?? []) {
        if (m.role === "user" || m.role === "assistant") {
          history.push({ role: m.role as "user" | "assistant", content: m.content as string });
        }
      }
    }
  }

  if (!conversationId) {
    const { data: newConvo } = await admin
      .from("conversations")
      .insert({
        chatbot_id: chatbot.id,
        organization_id: chatbot.organization_id,
        visitor_id: body.visitorId,
        channel: "web",
      })
      .select("id")
      .single();
    conversationId = newConvo!.id as string;
  }

  // ── Persist user message
  await admin.from("messages").insert({
    conversation_id: conversationId,
    chatbot_id: chatbot.id,
    organization_id: chatbot.organization_id,
    role: "user",
    content: body.message,
  });

  // ── Stream RAG response
  const encoder = new TextEncoder();
  const startedAt = Date.now();
  let assistantContent = "";
  let sourcesUsed: { id: string; source_id: string; preview: string; similarity: number }[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      // First event: tell the client which conversation this is
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "meta", conversationId })}\n\n`)
      );

      try {
        for await (const event of runRagChat({
          chatbot,
          userMessage: body.message,
          history,
          locale: body.locale,
        })) {
          if (event.type === "sources") sourcesUsed = event.items;
          if (event.type === "delta") assistantContent += event.content;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

          if (event.type === "done" || event.type === "error") break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`)
        );
      } finally {
        // ── Persist assistant message + usage BEFORE closing the stream so we
        //    survive serverless cold-stop after `controller.close()`.
        if (assistantContent) {
          const latencyMs = Date.now() - startedAt;
          try {
            await admin.from("messages").insert({
              conversation_id: conversationId,
              chatbot_id: chatbot.id,
              organization_id: chatbot.organization_id,
              role: "assistant",
              content: assistantContent,
              sources_used: sourcesUsed,
              latency_ms: latencyMs,
            });
            await incrementUsage({
              organizationId: chatbot.organization_id,
              chatbotId: chatbot.id,
              messages: 1,
            });
            await admin
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          } catch (err) {
            console.error("[widget/message] post-stream persist failed:", err);
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
