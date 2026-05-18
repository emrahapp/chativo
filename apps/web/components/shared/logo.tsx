import { cn } from "@/lib/utils";

export function Logo({ className, variant = "dark" }: { className?: string; variant?: "dark" | "light" }) {
  const fg = variant === "light" ? "text-white" : "text-foreground";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c0-4.5 4-8 9-8s9 3.5 9 8-4 8-9 8c-1.4 0-2.7-.3-3.9-.7L3 21l1.3-4A8.5 8.5 0 0 1 3 12Z" />
        </svg>
      </div>
      <span className={cn("text-lg font-semibold tracking-tight", fg)}>Chativo</span>
    </div>
  );
}
