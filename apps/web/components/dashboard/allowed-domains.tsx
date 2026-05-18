"use client";

import { useState, useTransition } from "react";
import { Globe, Plus, X, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAllowedDomainAction, removeAllowedDomainAction } from "@/app/actions/chatbots";
import { cn } from "@/lib/utils";

export function AllowedDomainsEditor({
  chatbotId,
  initialDomains,
}: {
  chatbotId: string;
  initialDomains: string[];
}) {
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setError(null);
    setInfo(null);
    start(async () => {
      const res = await addAllowedDomainAction(chatbotId, v);
      if (!res.ok) {
        setError(res.error ?? "Hata");
        return;
      }
      const normalized = v
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/\/$/, "");
      setDomains((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
      setInput("");
      setInfo(`${normalized} eklendi.`);
    });
  }

  function remove(domain: string) {
    setError(null);
    setInfo(null);
    start(async () => {
      const res = await removeAllowedDomainAction(chatbotId, domain);
      if (!res.ok) {
        setError(res.error ?? "Hata");
        return;
      }
      setDomains((prev) => prev.filter((d) => d !== domain));
      setInfo(`${domain} kaldırıldı.`);
    });
  }

  const isOpen = domains.length === 0;

  return (
    <div className="space-y-3">
      <div className={cn(
        "rounded-xl border p-3 text-sm",
        isOpen
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      )}>
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {isOpen ? (
              <>
                <p className="font-medium">Tüm domain'lerden açık</p>
                <p className="mt-1 text-amber-800">
                  Şu an widget herhangi bir siteden çalışabilir. Production için bot'u sadece kendi sitenle kısıtlamak için domain ekle.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">{domains.length} domain ile sınırlı</p>
                <p className="mt-1 text-emerald-800">
                  Widget yalnızca aşağıdaki domain'lerden çalışır. Diğer sitelerden gelen istekler reddedilir.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Existing chips */}
      {domains.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {domains.map((d) => (
            <li
              key={d}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-3 pr-1 text-sm"
            >
              <Globe className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-mono text-xs">{d}</span>
              <button
                type="button"
                onClick={() => remove(d)}
                disabled={pending}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                aria-label={`${d} kaldır`}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <form onSubmit={add} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="örn. ornek.com veya *.ornek.com"
            maxLength={200}
            disabled={pending}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={pending || !input.trim()}>
          <Plus className="h-4 w-4" />
          Ekle
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        İpucu: <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">ornek.com</code> hem apex hem www'yi kapsar.{" "}
        <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">*.ornek.com</code> tüm subdomain'leri kabul eder.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && !error && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{info}</span>
        </div>
      )}
    </div>
  );
}
