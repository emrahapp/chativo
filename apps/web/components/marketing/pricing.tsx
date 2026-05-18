import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Pricing({ t }: { t: Dictionary }) {
  const tiers = [
    { ...t.pricing.free, id: "free", popular: false },
    { ...t.pricing.starter, id: "starter", popular: false },
    { ...t.pricing.pro, id: "pro", popular: true },
    { ...t.pricing.agency, id: "agency", popular: false },
  ];
  return (
    <section id="pricing" className="border-t border-border/60 bg-secondary/50">
      <div className="container-wide py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-white p-7 transition-shadow",
                tier.popular
                  ? "border-brand-500 shadow-glow ring-1 ring-brand-500"
                  : "border-border hover:shadow-soft"
              )}
            >
              {tier.popular && (
                <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {t.pricing.cta_pro}
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground">/ {t.pricing.monthly.toLowerCase()}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full" variant={tier.popular ? "default" : "outline"}>
                <Link href={`/register?plan=${tier.id}`}>{t.pricing.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
