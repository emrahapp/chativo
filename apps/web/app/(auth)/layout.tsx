import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Minimal header — sadece logo */}
      <header className="px-8 pt-8">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal footer — Link tarzı */}
      <footer className="flex flex-col items-center gap-3 pb-10">
        <Link href="/support" className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70">
          Help
        </Link>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/kvkk" className="hover:text-foreground">KVKK</Link>
        </div>
      </footer>
    </div>
  );
}
