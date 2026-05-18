import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  planName: string;
  used: number;
  limit: number;
  isUpgradeable: boolean;
}

export function PlanCard({ planName, used, limit, isUpgradeable }: PlanCardProps) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const overage = used >= limit;
  return (
    <div className="mx-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
          {planName} Plan
        </p>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-semibold", overage ? "text-amber-300" : "text-white")}>
          {used.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")}
        </span>
        <span className="text-sidebar-muted-foreground">mesaj</span>
      </div>
      <Progress value={pct} className="mt-2 h-1.5 bg-sidebar-muted" />
      {isUpgradeable && (
        <Link
          href="/billing"
          className="mt-3 block rounded-lg bg-brand-500 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-brand-600"
        >
          Planı Yükselt
        </Link>
      )}
    </div>
  );
}
