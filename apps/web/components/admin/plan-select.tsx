"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setOrganizationPlanAction } from "@/app/actions/admin";

const PLANS = ["free", "starter", "pro", "agency"] as const;

export function PlanSelect({
  organizationId,
  current,
}: {
  organizationId: string;
  current: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (next === current) return;
          const fd = new FormData();
          fd.set("organizationId", organizationId);
          fd.set("planId", next);
          start(async () => {
            await setOrganizationPlanAction(fd);
          });
        }}
        className="h-8 rounded-md border border-border bg-white px-2 text-xs font-medium capitalize text-foreground"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
