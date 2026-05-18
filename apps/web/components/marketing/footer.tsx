import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function MarketingFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-wide py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t.hero.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <FooterCol title={t.footer.product} links={[
              { label: t.nav.features, href: "#features" },
              { label: t.nav.pricing, href: "#pricing" },
              { label: t.nav.demo, href: "#demo" },
            ]} />
            <FooterCol title={t.footer.company} links={[
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
            ]} />
            <FooterCol title={t.footer.legal} links={[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "KVKK / GDPR", href: "/kvkk" },
            ]} />
            <FooterCol title={t.footer.support} links={[
              { label: "Docs", href: "#" },
              { label: "Contact", href: "mailto:hello@chativo.ai" },
            ]} />
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">{t.footer.copy}</p>
          <p className="text-xs text-muted-foreground">Made with care for builders.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
