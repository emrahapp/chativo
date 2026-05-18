"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Bot, Database, MessagesSquare, Users, BarChart3, Settings, CreditCard, ShieldCheck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
  badge?: string | null;
}

const iconMap = {
  overview: LayoutDashboard,
  chatbots: Bot,
  knowledge: Database,
  conversations: MessagesSquare,
  leads: Users,
  analytics: BarChart3,
  settings: Settings,
  billing: CreditCard,
  admin: ShieldCheck,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-500 text-white shadow-glow"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-sidebar-muted-foreground group-hover:text-white")} />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                active ? "bg-white/20 text-white" : "bg-sidebar-muted text-sidebar-foreground"
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
