"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function FAQ({ t }: { t: Dictionary }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border/60 bg-white">
      <div className="container-narrow py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.faq.title}
          </h2>
        </div>
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-white">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full flex-col items-start gap-2 px-6 py-5 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-base font-medium text-foreground">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
                {isOpen && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground animate-fade-in">
                    {item.a}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
