"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toggleUserAdminAction } from "@/app/actions/admin";

export function AdminToggle({
  userId,
  isAdmin,
  isSelf,
}: {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [checked, setChecked] = useState(isAdmin);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={pending || (isSelf && checked)}
        onCheckedChange={(next) => {
          setError(null);
          const prev = checked;
          setChecked(next);
          start(async () => {
            const fd = new FormData();
            fd.set("userId", userId);
            fd.set("nextValue", next ? "true" : "false");
            const res = await toggleUserAdminAction(fd);
            if (!res.ok) {
              setChecked(prev);
              setError(res.error ?? "Hata");
            }
          });
        }}
      />
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
