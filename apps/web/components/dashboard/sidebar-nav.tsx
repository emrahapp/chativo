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
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                active ? "bg-white text-foreground" : "bg-secondary text-muted-foreground"
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
