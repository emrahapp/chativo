import { Globe, FileText, BookOpen, MessageSquareText, FileType2, Type } from "lucide-react";
import { SourceStatusBadge } from "./source-status-badge";
import { SourceRowActions } from "./source-row-actions";

export interface SourceRow {
  id: string;
  type: "website" | "pdf" | "docx" | "txt" | "manual" | "faq" | string;
  title: string;
  source_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  chunk_count: number;
  error_message: string | null;
  created_at: string;
}

const ICONS: Record<string, typeof Globe> = {
  website: Globe,
  pdf: FileText,
  docx: FileType2,
  txt: Type,
  manual: MessageSquareText,
  faq: BookOpen,
};

const LABELS: Record<string, string> = {
  website: "URL",
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  manual: "Metin",
  faq: "SSS",
};

export function SourceList({
  sources,
  showBotColumn = false,
  emptyMessage,
}: {
  sources: (SourceRow & { botName?: string })[];
  showBotColumn?: boolean;
  emptyMessage?: string;
}) {
  if (sources.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Henüz kaynak yok. Yukarıdaki sekmelerden bir kaynak ekleyebilirsin."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Kaynak</th>
            <th className="px-4 py-3 text-left font-medium">Tip</th>
            {showBotColumn && <th className="px-4 py-3 text-left font-medium">Bot</th>}
            <th className="px-4 py-3 text-left font-medium">Durum</th>
            <th className="px-4 py-3 text-right font-medium">Parça</th>
            <th className="px-4 py-3 text-right font-medium" aria-label="Aksiyonlar" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sources.map((s) => {
            const Icon = ICONS[s.type] ?? Globe;
            return (
              <tr key={s.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{s.title}</p>
                      {s.source_url && (
                        <p className="truncate text-xs text-muted-foreground">{s.source_url}</p>
                      )}
                      {s.status === "failed" && s.error_message && (
                        <p className="mt-1 text-xs text-red-600">{s.error_message}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{LABELS[s.type] ?? s.type}</td>
                {showBotColumn && (
                  <td className="px-4 py-3 text-muted-foreground">{(s as { botName?: string }).botName ?? "—"}</td>
                )}
                <td className="px-4 py-3">
                  <SourceStatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                  {s.chunk_count}
                </td>
                <td className="px-4 py-3">
                  <SourceRowActions
                    sourceId={s.id}
                    canRetrain={s.type === "website" || s.type === "manual"}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
