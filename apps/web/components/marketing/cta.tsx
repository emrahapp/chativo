import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function CTA({ t }: { t: Dictionary }) {
  return (
    <section className="border-t border-border bg-white">
      <div className="container-wide py-16">
        <div className="rounded-2xl border border-border bg-brand-500 p-10 sm:p-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {t.hero.title_a} <span className="underline decoration-white/30 underline-offset-4">{t.hero.title_highlight}</span> {t.hero.title_b}
            </h2>
            <p className="mt-4 text-base text-white/80">{t.hero.subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/95">
                <Link href="/register">
                  {t.hero.cta_primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="#demo">{t.hero.cta_secondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
