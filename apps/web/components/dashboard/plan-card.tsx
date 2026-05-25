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
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {planName}
        </p>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 text-xs">
        <span className={cn("font-semibold", overage ? "text-amber-600" : "text-foreground")}>
          {used.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")}
        </span>
        <span className="text-muted-foreground">mesaj</span>
      </div>
      <Progress value={pct} className="mt-2 h-1.5" />
      {isUpgradeable && (
        <Link
          href="/billing"
          className="mt-2.5 block rounded-lg bg-brand-500 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-brand-600"
        >
          Planı Yükselt
        </Link>
      )}
    </div>
  );
}
