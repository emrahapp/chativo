import Link from "next/link";
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroWidgetPreview } from "@/components/widget-preview/hero-widget";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <section className="bg-white">
      <div className="container-wide grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        {/* Left: copy */}
        <div className="flex flex-col justify-center">
          <Badge variant="outline" className="w-fit border-border text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
            {t.hero.badge}
          </Badge>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl">
            {t.hero.title_a}{" "}
            <span className="text-foreground">{t.hero.title_highlight}</span>{" "}
            {t.hero.title_b}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Button asChild size="lg">
              <Link href="/register">
                {t.hero.cta_primary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#demo">
                <PlayCircle className="h-4 w-4" />
                {t.hero.cta_secondary}
              </Link>
            </Button>
          </div>

          <p className="mt-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t.hero.trusted_by}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-3">
            {["Trendyol", "ikas", "T-Soft", "Ideasoft", "Ticimax", "Shopify"].map((b) => (
              <span key={b} className="text-sm font-medium text-muted-foreground">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right: widget preview — contained card, no glow */}
        <div className="flex items-center justify-center">
          <HeroWidgetPreview locale={locale} />
        </div>
      </div>
    </section>
  );
}
