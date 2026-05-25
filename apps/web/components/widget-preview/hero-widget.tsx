import { cn } from "@/lib/utils";

/**
 * Static, marketing-only widget preview for the landing hero.
 * No interactivity — pure visual mock.
 */
export function HeroWidgetPreview({
  className,
  locale = "tr",
}: {
  className?: string;
  locale?: "tr" | "en";
}) {
  const copy = {
    tr: {
      botName: "E-Ticaret Asistanı",
      online: "Çevrimiçi",
      greeting: "Merhaba 👋 Size nasıl yardımcı olabilirim?",
      userMsg: "Kargo süresi kaç gün?",
      botReply:
        "Türkiye'nin her yerine 2-3 iş günü içinde teslim ediyoruz. Detaylı bilgi için kargo sayfamızı ziyaret edebilirsiniz.",
      quick: ["Kargo Takibi", "İade Koşulları", "Diğer Sorular"],
      placeholder: "Sorunuzu yazın...",
    },
    en: {
      botName: "E-commerce Assistant",
      online: "Online",
      greeting: "Hi 👋 How can I help you today?",
      userMsg: "How long does shipping take?",
      botReply:
        "We deliver across the country within 2–3 business days. For details, check our shipping page.",
      quick: ["Track order", "Returns", "Other questions"],
      placeholder: "Type your question...",
    },
  }[locale];

  return (
    <div
      className={cn(
        "relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-border bg-white shadow-soft",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <span className="text-sm font-semibold">EA</span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{copy.botName}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-300" />
              <span className="text-[11px] text-white/80">{copy.online}</span>
            </div>
          </div>
        </div>
        <button className="text-white/70 transition-colors hover:text-white" aria-label="Close">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground">
            {copy.greeting}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-white">
            {copy.userMsg}
          </div>
        </div>

        <div className="flex max-w-[85%] items-start gap-2">
          <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground">
            {copy.botReply}
          </div>
        </div>

        {/* Quick replies */}
        <div className="mt-1 flex flex-wrap gap-2">
          {copy.quick.map((q) => (
            <span
              key={q}
              className="cursor-pointer rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
            >
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <input
            type="text"
            placeholder={copy.placeholder}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            readOnly
          />
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600" aria-label="Send">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Chativo</span>
        </p>
      </div>
    </div>
  );
}
