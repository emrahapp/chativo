import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;            // percent change vs prior period
  hint?: string;
  icon?: React.ReactNode;
  accent?: "default" | "warning";
}

export function KpiCard({ label, value, delta, hint, icon, accent = "default" }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {icon && (
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              accent === "warning" ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600"
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {typeof delta === "number" && (
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? "+" : ""}{delta}%
            </span>
          )}
        </div>

        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
