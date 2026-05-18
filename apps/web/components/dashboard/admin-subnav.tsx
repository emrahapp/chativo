"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin",               label: "Overview",      icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/users",         label: "Users",         icon: Users },
  { href: "/admin/chatbots",      label: "Chatbots",      icon: Bot },
];

export function AdminSubnav() {
  const pathname = usePathname();
  return (
    <nav className="inline-flex items-center gap-1 rounded-xl border border-border bg-white p-1 shadow-soft">
      {ITEMS.map((it) => {
        const active = it.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
