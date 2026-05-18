"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "./copy-button";
import { publishChatbotAction, type FormState } from "@/app/actions/chatbots";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

export function StepPublishForm({
  chatbot,
  appUrl,
}: {
  chatbot: ChatbotRecord;
  appUrl: string;
}) {
  const [state, formAction] = useActionState<FormState | null, FormData>(publishChatbotAction, null);

  const snippet = `<script src="${appUrl}/widget.js" data-chatbot-id="${chatbot.id}" async defer></script>`;

  if (state?.ok) {
    return <PublishSuccess chatbot={chatbot} snippet={snippet} />;
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="chatbotId" value={chatbot.id} />

      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Yayına almaya hazır</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Botu aktifleştirip embed kodunu al. Sitende sağ alt köşede widget olarak görünecek.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedDomain">Domain (opsiyonel)</Label>
        <Input
          id="allowedDomain"
          name="allowedDomain"
          placeholder="örnek.com"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Widget'ın yalnızca bu domain'de çalışmasını sağlar. Sonra ayarlardan değiştirebilirsin.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Embed kodu (önizleme)</Label>
        <div className="relative rounded-xl border border-border bg-zinc-950 p-4">
          <pre className="overflow-x-auto pr-20 text-xs leading-relaxed text-zinc-100">
            <code>{snippet}</code>
          </pre>
          <CopyButton
            text={snippet}
            className="absolute right-3 top-3 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            variant="outline"
            label="Kopyala"
          />
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button asChild variant="ghost">
          <Link href={`/chatbots/${chatbot.id}/setup?step=test`}>Geri</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function PublishSuccess({ chatbot, snippet }: { chatbot: ChatbotRecord; snippet: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h3 className="text-lg font-semibold text-emerald-900">Bot yayında 🚀</h3>
        <p className="max-w-md text-sm text-emerald-800">
          Aşağıdaki kodu sitenin <code className="rounded bg-white/60 px-1 py-0.5 text-xs">&lt;/body&gt;</code> kapanışından önce ekle. Widget otomatik olarak görünecek.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Embed kodu</Label>
        <div className="relative rounded-xl border border-border bg-zinc-950 p-4">
          <pre className="overflow-x-auto pr-20 text-xs leading-relaxed text-zinc-100">
            <code>{snippet}</code>
          </pre>
          <CopyButton
            text={snippet}
            className="absolute right-3 top-3 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
            variant="outline"
            label="Kopyala"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href={`/chatbots/${chatbot.id}`}>
            Bot ayrıntılarına git
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/chatbots">Tüm botlar</Link>
        </Button>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" variant="gradient">
      {pending ? "Yayınlanıyor..." : "Yayına Al"}
    </Button>
  );
}
