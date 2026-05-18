"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, RotateCcw, AlertCircle, ChevronDown, Sparkles } from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

interface SourceUsed {
  id: string;
  source_id: string;
  preview: string;
  similarity: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceUsed[];
  error?: string;
  streaming?: boolean;
}

export function ChatPanel({
  chatbot,
  variant = "card",
}: {
  chatbot: ChatbotRecord;
  variant?: "card" | "fullscreen";
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    const userMsg: ChatMessage = { id: nanoid(), role: "user", content: message };
    const botId = nanoid();
    const botMsg: ChatMessage = { id: botId, role: "assistant", content: "", streaming: true };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setBusy(true);

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}/test-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Sunucu hatası");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          const payload = safeParse(ev.slice(6));
          if (!payload) continue;
          applyEvent(setMessages, botId, payload);
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, streaming: false, error: err instanceof Error ? err.message : "Hata" }
            : m
        )
      );
    } finally {
      setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, streaming: false } : m)));
      setBusy(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    start(() => setMessages([]));
  }

  const wrapperClass =
    variant === "fullscreen"
      ? "flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft"
      : "flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border bg-white";

  return (
    <div className={wrapperClass}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 text-white"
        style={{ backgroundColor: chatbot.primary_color }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
            {chatbot.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{chatbot.name}</p>
            <p className="mt-0.5 text-[11px] text-white/80">Test modu · sadece sen görüyorsun</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={pending || busy}
          className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-medium transition-colors hover:bg-white/25 disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
          Sıfırla
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-secondary/20 px-4 py-5">
        {messages.length === 0 ? (
          <EmptyChat chatbot={chatbot} onPick={(q) => send(q)} />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <Message key={m.id} message={m} primaryColor={chatbot.primary_color} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="border-t border-border bg-white px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Sorunuzu yazın..."
            disabled={busy}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: chatbot.primary_color }}
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Message({ message, primaryColor }: { message: ChatMessage; primaryColor: string }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 break-words">{message.error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[90%]">
      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
        {message.content || <TypingDots />}
      </div>
      {message.sources && message.sources.length > 0 && <SourcesAccordion sources={message.sources} />}
    </div>
  );
}

function SourcesAccordion({ sources }: { sources: SourceUsed[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ml-1 mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Sparkles className="h-3 w-3 text-brand-500" />
        {sources.length} kaynak parçası kullanıldı
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1.5">
          {sources.map((s, i) => (
            <li
              key={s.id}
              className="rounded-lg border border-border bg-white px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"
            >
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="font-medium text-brand-600">#{i + 1}</span>
                <span className="font-mono text-[10px]">benzerlik {s.similarity}</span>
              </div>
              <p className="line-clamp-3">{s.preview}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyChat({
  chatbot,
  onPick,
}: {
  chatbot: ChatbotRecord;
  onPick: (q: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: chatbot.primary_color }}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{chatbot.name}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {chatbot.welcome_message ?? "Merhaba 👋 Size nasıl yardımcı olabilirim?"}
      </p>
      {chatbot.quick_questions?.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {chatbot.quick_questions.slice(0, 3).map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onPick(q.label)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: `${chatbot.primary_color}1A`,
                color: chatbot.primary_color,
                border: `1px solid ${chatbot.primary_color}33`,
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground" />
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:400ms]" />
    </span>
  );
}

// ── helpers ─────────────────────────────────────────────────────
function safeParse(s: string): { type: string; [k: string]: unknown } | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function applyEvent(
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  botId: string,
  ev: { type: string; [k: string]: unknown }
) {
  if (ev.type === "delta") {
    const delta = String(ev.content ?? "");
    setMessages((prev) =>
      prev.map((m) => (m.id === botId ? { ...m, content: m.content + delta } : m))
    );
  } else if (ev.type === "sources") {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === botId ? { ...m, sources: (ev.items as SourceUsed[]) ?? [] } : m
      )
    );
  } else if (ev.type === "error") {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === botId
          ? { ...m, error: String(ev.message ?? "Hata"), streaming: false }
          : m
      )
    );
  }
}
