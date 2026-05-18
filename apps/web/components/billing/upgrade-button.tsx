"use client";

import { useState, useTransition } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function UpgradeButton({
  planId,
  cadence = "monthly",
  variant = "default",
  className,
  children,
}: {
  planId: "starter" | "pro" | "agency";
  cadence?: "monthly" | "yearly";
  variant?: ButtonProps["variant"];
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Button
        type="button"
        disabled={pending}
        variant={variant}
        className={className}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, cadence }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.url) {
                throw new Error(data?.error ?? `HTTP ${res.status}`);
              }
              window.location.href = data.url;
            } catch (e) {
              setError(e instanceof Error ? e.message : "Hata");
            }
          })
        }
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Yönlendiriliyor...</>
        ) : (
          children
        )}
      </Button>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
