"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export function FileUploadForm({
  chatbotId,
  maxMb,
}: {
  chatbotId: string;
  maxMb: number;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setError(null);
    setInfo(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > maxMb * 1024 * 1024) {
      setError(`Dosya ${maxMb} MB sınırını aşıyor (${(f.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setFile(f);
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());

    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/sources/upload`, {
        method: "POST",
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
      }
      setStatus("success");
      setInfo(`${(body as { chunks?: number }).chunks ?? 0} parça oluşturuldu.`);
      setFile(null);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      start(() => router.refresh());
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) pick(f);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center transition-colors",
          dragOver ? "border-brand-500 bg-brand-50/40" : "border-border hover:border-brand-200 hover:bg-secondary/30",
          status === "uploading" && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {!file ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Dosya bırak veya <span className="text-brand-600">seçmek için tıkla</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, TXT, MD · maksimum {maxMb} MB
              </p>
            </div>
          </>
        ) : (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); pick(null); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Dosyayı kaldır"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-title">Başlık (opsiyonel)</Label>
        <Input
          id="file-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="örn. İade politikası belgesi"
          maxLength={200}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status === "success" && info && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{info}</span>
        </div>
      )}

      <Button type="submit" disabled={!file || status === "uploading" || pending}>
        {status === "uploading" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor + eğitiliyor...</>
        ) : (
          <><Upload className="h-4 w-4" /> Yükle ve eğit</>
        )}
      </Button>
    </form>
  );
}
