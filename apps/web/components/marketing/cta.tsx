import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function CTA({ t }: { t: Dictionary }) {
  return (
    <section className="border-t border-border/60 bg-white">
      <div className="container-wide py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-10 sm:p-16">
          <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              {t.hero.title_a} <span className="underline decoration-white/40 underline-offset-4">{t.hero.title_highlight}</span> {t.hero.title_b}
            </h2>
            <p className="mt-4 text-base text-white/85">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="xl" className="bg-white text-brand-700 shadow-soft-lg hover:bg-white/95">
                <Link href="/register">
                  {t.hero.cta_primary}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Link href="#demo">{t.hero.cta_secondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
