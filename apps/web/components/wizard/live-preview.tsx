"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface PreviewConfig {
  botName: string;
  primaryColor: string;
  welcomeMessage: string;
  quickQuestions: { label: string }[];
  theme: "light" | "dark" | "system";
}

/**
 * Static visual preview of the widget. Read-only.
 * Reads config from React props; the wizard steps update those props as the user types.
 */
export function LivePreview({ config }: { config: PreviewConfig }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = config.theme === "dark";

  return (
    <div className="sticky top-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Canlı Önizleme
      </p>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border shadow-soft transition-colors",
          dark ? "border-zinc-700 bg-zinc-900" : "border-border bg-white"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
              {config.botName.slice(0, 2).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{config.botName || "Bot"}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse-dot" />
                <span className="text-[11px] text-white/80">Çevrimiçi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={cn("flex flex-col gap-3 px-5 py-5", dark && "bg-zinc-900")}>
          <div className="max-w-[85%]">
            <div className={cn(
              "rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed",
              dark ? "bg-zinc-800 text-zinc-100" : "bg-secondary text-foreground"
            )}>
              {config.welcomeMessage || "Merhaba 👋 Size nasıl yardımcı olabilirim?"}
            </div>
          </div>

          {config.quickQuestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {config.quickQuestions.slice(0, 3).map((q, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${config.primaryColor}1A`,
                    color: config.primaryColor,
                    border: `1px solid ${config.primaryColor}33`,
                  }}
                >
                  {q.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className={cn("border-t px-4 py-3", dark ? "border-zinc-700 bg-zinc-900" : "border-border bg-white")}>
          <div className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2",
            dark ? "bg-zinc-800" : "bg-secondary"
          )}>
            <span className={cn("flex-1 text-sm", dark ? "text-zinc-500" : "text-muted-foreground")}>
              Sorunuzu yazın...
            </span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: config.primaryColor }}
              aria-hidden
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          {mounted && (
            <p className={cn("mt-2 text-center text-[10px]", dark ? "text-zinc-500" : "text-muted-foreground")}>
              Powered by <span className="font-semibold">Chativo</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
