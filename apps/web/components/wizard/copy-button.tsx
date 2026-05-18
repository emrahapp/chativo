"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({
  text,
  className,
  size = "sm",
  variant = "outline",
  label = "Kopyala",
}: { text: string; label?: string } & Pick<ButtonProps, "className" | "size" | "variant">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {copied ? "Kopyalandı" : label}
    </Button>
  );
}
