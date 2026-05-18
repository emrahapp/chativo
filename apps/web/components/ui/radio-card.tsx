"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioCardOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioCardGroupProps<T extends string> {
  name: string;
  options: RadioCardOption<T>[];
  defaultValue?: T;
  value?: T;
  onChange?: (value: T) => void;
  columns?: 2 | 3 | 4;
}

export function RadioCardGroup<T extends string>({
  name,
  options,
  defaultValue,
  value,
  onChange,
  columns = 3,
}: RadioCardGroupProps<T>) {
  const [internal, setInternal] = React.useState<T | undefined>(defaultValue);
  const current = value ?? internal;
  const setCurrent = (v: T) => {
    setInternal(v);
    onChange?.(v);
  };
  const gridCols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-3", gridCols)}>
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "group relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-white p-4 transition-all",
              active
                ? "border-brand-500 ring-2 ring-brand-500/30 shadow-soft"
                : "border-border hover:border-brand-200 hover:bg-secondary/40"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => setCurrent(opt.value)}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              {opt.icon && (
                <span className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
                )}>
                  {opt.icon}
                </span>
              )}
              <span className={cn("text-sm font-medium", active ? "text-brand-700" : "text-foreground")}>
                {opt.label}
              </span>
            </div>
            {opt.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
            )}
          </label>
        );
      })}
    </div>
  );
}
