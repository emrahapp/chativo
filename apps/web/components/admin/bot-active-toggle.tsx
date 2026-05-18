"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setChatbotActiveAdminAction } from "@/app/actions/admin";

export function BotActiveToggle({ chatbotId, isActive }: { chatbotId: string; isActive: boolean }) {
  const [checked, setChecked] = useState(isActive);
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={pending}
        onCheckedChange={(next) => {
          const prev = checked;
          setChecked(next);
          start(async () => {
            const fd = new FormData();
            fd.set("chatbotId", chatbotId);
            fd.set("nextValue", next ? "true" : "false");
            const res = await setChatbotActiveAdminAction(fd);
            if (!res.ok) setChecked(prev);
          });
        }}
      />
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
