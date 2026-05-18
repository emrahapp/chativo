import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStepKey = "info" | "sources" | "behavior" | "appearance" | "test" | "publish";

export interface WizardStep {
  key: WizardStepKey;
  label: string;
  href: string | null;       // null = not yet accessible
  status: "pending" | "current" | "completed";
}

export function Stepper({ steps }: { steps: WizardStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 rounded-2xl border border-border bg-white p-3 shadow-soft sm:p-4">
      {steps.map((step, i) => {
        const isFirst = i === 0;
        const stepNumber = i + 1;
        const isCompleted = step.status === "completed";
        const isCurrent = step.status === "current";

        const inner = (
          <span className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
            isCurrent && "bg-brand-50 text-brand-700",
            isCompleted && "text-foreground hover:bg-secondary",
            !isCurrent && !isCompleted && "text-muted-foreground"
          )}>
            <span className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
              isCompleted && "bg-brand-500 text-white",
              isCurrent && "bg-brand-500 text-white",
              !isCurrent && !isCompleted && "border border-border bg-white text-muted-foreground"
            )}>
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNumber}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </span>
        );

        return (
          <li key={step.key} className="flex items-center gap-2">
            {!isFirst && (
              <span className={cn("h-px w-4 sm:w-6", isCompleted ? "bg-brand-500" : "bg-border")} />
            )}
            {step.href ? <Link href={step.href}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ol>
  );
}

export function buildSteps(chatbotId: string | null, currentKey: WizardStepKey): WizardStep[] {
  const base: { key: WizardStepKey; label: string }[] = [
    { key: "info",       label: "Bilgiler" },
    { key: "sources",    label: "Veri Kaynakları" },
    { key: "behavior",   label: "Davranış" },
    { key: "appearance", label: "Görünüm" },
    { key: "test",       label: "Test Et" },
    { key: "publish",    label: "Yayına Al" },
  ];
  const order = base.map((b) => b.key);
  const currentIdx = order.indexOf(currentKey);
  return base.map((b, i) => {
    const status: WizardStep["status"] =
      i < currentIdx ? "completed" : i === currentIdx ? "current" : "pending";
    const href =
      b.key === "info"
        ? "/chatbots/new"
        : chatbotId
        ? `/chatbots/${chatbotId}/setup?step=${b.key}`
        : null;
    return { ...b, status, href };
  });
}
