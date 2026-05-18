"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setChatbotActiveAction } from "@/app/actions/chatbots";

export function ChatbotActiveToggle({ chatbotId, isActive }: { chatbotId: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {isActive ? "Aktif" : "Pasif"}
      </span>
      <Switch
        checked={isActive}
        disabled={pending}
        onCheckedChange={(checked) => start(() => setChatbotActiveAction(chatbotId, checked))}
      />
    </div>
  );
}
