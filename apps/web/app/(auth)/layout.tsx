import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getServerDictionary();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-white lg:flex">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(at_20%_30%,rgba(101,84,232,0.4),transparent_50%),radial-gradient(at_80%_70%,rgba(168,85,247,0.25),transparent_50%)]" />
        <Link href="/" className="relative z-10">
          <Logo variant="light" />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            {t.hero.title_a}{" "}
            <span className="bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">
              {t.hero.title_highlight}
            </span>{" "}
            {t.hero.title_b}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground">{t.hero.subtitle}</p>
        </div>
        <p className="relative z-10 text-xs text-sidebar-muted-foreground">© 2026 Chativo</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
