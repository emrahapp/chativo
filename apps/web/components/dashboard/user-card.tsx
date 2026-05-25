"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/app/actions/auth";

/**
 * Light-theme user card — Link app tarzı.
 * Büyük dairesel avatar + ortada isim + email. Tıklanınca logout menüsü açılır.
 */
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
    <div className="relative px-4 pb-3 pt-1">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors hover:bg-secondary/60"
      >
        <Avatar className="h-12 w-12 ring-2 ring-secondary">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="text-sm">{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name || email.split("@")[0]}</p>
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        </div>
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-soft-lg">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => signOutAction())}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {pending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      )}
    </div>
  );
}
