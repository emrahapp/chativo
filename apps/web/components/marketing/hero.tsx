import Link from "next/link";
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroWidgetPreview } from "@/components/widget-preview/hero-widget";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-hero-gradient">
      <div className="container-wide grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        {/* Left: copy */}
        <div className="flex flex-col justify-center">
          <Badge variant="default" className="w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            {t.hero.badge}
          </Badge>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            {t.hero.title_a}{" "}
            <span className="gradient-text">{t.hero.title_highlight}</span>{" "}
            {t.hero.title_b}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="xl" variant="gradient">
              <Link href="/register">
                {t.hero.cta_primary}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#demo">
                <PlayCircle className="h-5 w-5" />
                {t.hero.cta_secondary}
              </Link>
            </Button>
          </div>

          <p className="mt-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.hero.trusted_by}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 opacity-60">
            {["Trendyol", "ikas", "T-Soft", "Ideasoft", "Ticimax", "Shopify"].map((b) => (
              <span key={b} className="text-sm font-semibold text-muted-foreground">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right: widget preview */}
        <div className="relative flex items-center justify-center">
          {/* Soft glow behind widget */}
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-brand-500/10 blur-3xl" />
          <HeroWidgetPreview locale={locale} className="animate-fade-in" />
        </div>
      </div>
    </section>
  );
}
