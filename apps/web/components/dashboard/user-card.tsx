"use client";

import { LogOut, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

export function UserCard({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const initials = (name || email).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="relative mx-3">
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent shadow-soft-lg">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => signOutAction())}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-muted disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {pending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors",
          "hover:bg-sidebar-accent hover:border-sidebar-border"
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{name || email.split("@")[0]}</p>
          <p className="truncate text-[11px] text-sidebar-muted-foreground">{email}</p>
        </div>
        <ChevronUp className={cn("h-4 w-4 text-sidebar-muted-foreground transition-transform", !open && "rotate-180")} />
      </button>
    </div>
  );
}
