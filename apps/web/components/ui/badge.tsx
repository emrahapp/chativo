import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-brand-100 bg-brand-50 text-brand-700",
        outline: "border-border bg-white text-foreground",
        success: "border-emerald-100 bg-emerald-50 text-emerald-700",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
        danger: "border-red-100 bg-red-50 text-red-700",
        muted: "border-border bg-secondary text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
