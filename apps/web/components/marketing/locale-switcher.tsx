"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { setLocale } from "@/app/actions/set-locale";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  current,
  className,
}: {
  current: Locale;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const next: Locale = current === "tr" ? "en" : "tr";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setLocale(next))}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50",
        className
      )}
      aria-label="Change language"
    >
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span>{current === "tr" ? "TR" : "EN"}</span>
    </button>
  );
}
