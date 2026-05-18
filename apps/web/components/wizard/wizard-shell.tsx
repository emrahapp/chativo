import { Stepper, type WizardStep } from "./stepper";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WizardShell({
  steps,
  title,
  description,
  preview,
  children,
}: {
  steps: WizardStep[];
  title: string;
  description?: string;
  preview?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Stepper steps={steps} />

      <div className={cn("grid gap-6", preview && "lg:grid-cols-[1.6fr_1fr]")}>
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
              {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
          </CardContent>
        </Card>

        {preview && <div className="hidden lg:block">{preview}</div>}
      </div>
    </div>
  );
}
