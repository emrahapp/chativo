import { ShoppingBag, Server, Stethoscope, GraduationCap, Home, Briefcase, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function UseCases({ t }: { t: Dictionary }) {
  const cases = [
    { icon: ShoppingBag,    label: t.use_cases.ecommerce },
    { icon: Server,         label: t.use_cases.saas },
    { icon: Stethoscope,    label: t.use_cases.clinics },
    { icon: GraduationCap,  label: t.use_cases.education },
    { icon: Home,           label: t.use_cases.realestate },
    { icon: Briefcase,      label: t.use_cases.services },
    { icon: Users,          label: t.use_cases.agencies },
  ];
  return (
    <section className="border-t border-border/60 bg-white">
      <div className="container-wide py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.use_cases.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t.use_cases.subtitle}</p>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {cases.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              <c.icon className="h-4 w-4 text-brand-500" />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
