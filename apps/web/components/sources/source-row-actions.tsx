"use client";

import { useTransition, useState } from "react";
import { RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { retrainSourceAction, deleteSourceAction } from "@/app/actions/sources";
import { Button } from "@/components/ui/button";

export function SourceRowActions({ sourceId, canRetrain }: { sourceId: string; canRetrain: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-end gap-1">
      {canRetrain && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          title="Yeniden eğit"
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await retrainSourceAction(sourceId);
              if (!res.ok && "error" in res) setError(res.error ?? "Hata");
            })
          }
        >
          <RefreshCw className={pending ? "animate-spin" : ""} />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title="Sil"
        onClick={() => {
          if (!confirm("Bu kaynağı silmek istediğinden emin misin? Tüm parçaları silinecek.")) return;
          start(async () => {
            setError(null);
            await deleteSourceAction(sourceId);
          });
        }}
      >
        <Trash2 className="text-red-500" />
      </Button>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  );
}
