import { Globe, FileText, MessageSquare, UserPlus, History, Languages, Palette, ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Features({ t }: { t: Dictionary }) {
  const items = [
    { icon: Globe,        ...t.features.items.website },
    { icon: FileText,     ...t.features.items.files },
    { icon: MessageSquare,...t.features.items.widget },
    { icon: UserPlus,     ...t.features.items.leads },
    { icon: History,      ...t.features.items.history },
    { icon: Languages,    ...t.features.items.multilang },
    { icon: Palette,      ...t.features.items.brand },
    { icon: ShieldCheck,  ...t.features.items.safe },
  ];
  return (
    <section id="features" className="border-t border-border/60 bg-secondary/50">
      <div className="container-wide py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.features.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{it.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
