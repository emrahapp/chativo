import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function MarketingNav({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-lg">
      <div className="container-wide flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.features}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.pricing}
            </Link>
            <Link href="#demo" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.demo}
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t.nav.resources}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} className="hidden sm:inline-flex" />
          <Link href="/login" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline">
            {t.nav.login}
          </Link>
          <Button asChild size="default">
            <Link href="/register">{t.nav.register}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
