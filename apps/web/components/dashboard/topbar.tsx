import Link from "next/link";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-white/80 px-6 backdrop-blur-lg">
      {/* Search */}
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Ara..."
          className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white"
        />
      </div>
      <div className="flex-1 md:hidden" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Bildirimler"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Button asChild size="sm">
          <Link href="/chatbots/new">
            <Plus className="h-4 w-4" />
            Yeni Chatbot
          </Link>
        </Button>
      </div>
    </header>
  );
}
