import { Upload, Sliders, Code2, MessagesSquare } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const icons = [Upload, Sliders, Code2, MessagesSquare];

export function HowItWorks({ t }: { t: Dictionary }) {
  const steps = [
    { title: t.how_it_works.step1_title, desc: t.how_it_works.step1_desc },
    { title: t.how_it_works.step2_title, desc: t.how_it_works.step2_desc },
    { title: t.how_it_works.step3_title, desc: t.how_it_works.step3_desc },
    { title: t.how_it_works.step4_title, desc: t.how_it_works.step4_desc },
  ];
  return (
    <section className="border-t border-border/60 bg-white">
      <div className="container-wide py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.how_it_works.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t.how_it_works.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = icons[i]!;
            return (
              <div
                key={s.title}
                className="group relative rounded-3xl border border-border bg-white p-6 transition-shadow hover:shadow-soft"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-brand-600">
                  0{i + 1}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
