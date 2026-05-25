"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createUrlSourceAction,
  createManualSourceAction,
  createSitemapSourcesAction,
  createFaqSourceAction,
  type SourceFormState,
} from "@/app/actions/sources";

function FeedbackBar({ state }: { state: SourceFormState | null }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.info ?? "Kaynak eklendi."}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.error ?? "Hata"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// URL
// ─────────────────────────────────────────────────────────────────────
export function UrlSourceForm({ chatbotId }: { chatbotId: string }) {
  const [state, formAction] = useActionState<SourceFormState | null, FormData>(createUrlSourceAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chatbotId" value={chatbotId} />
      <div className="space-y-2">
        <Label htmlFor="url">Web sitesi URL</Label>
        <Input id="url" name="url" placeholder="https://ornek.com/sss" required />
        <p className="text-xs text-muted-foreground">
          Sayfa içeriği taranıp temizlenerek bot bilgi tabanına eklenir. Tek sayfa için yeterli — toplu site
          taraması (sitemap) Faz 2'de gelecek.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url-title">Başlık (opsiyonel)</Label>
        <Input id="url-title" name="title" placeholder="örn. SSS sayfası" maxLength={200} />
      </div>
      <FeedbackBar state={state} />
      <UrlSubmit />
    </form>
  );
}

function UrlSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Taranıyor...</>) : (<><Plus className="h-4 w-4" /> URL'yi eğit</>)}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Manual text
// ─────────────────────────────────────────────────────────────────────
export function ManualSourceForm({ chatbotId }: { chatbotId: string }) {
  const [state, formAction] = useActionState<SourceFormState | null, FormData>(createManualSourceAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chatbotId" value={chatbotId} />
      <div className="space-y-2">
        <Label htmlFor="manual-title">Başlık</Label>
        <Input id="manual-title" name="title" placeholder="örn. İade politikası" maxLength={200} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-content">Metin içeriği</Label>
        <Textarea
          id="manual-content"
          name="content"
          required
          rows={10}
          minLength={20}
          maxLength={100_000}
          placeholder={"Buraya bot'un öğrenmesini istediğin metni yapıştır. Örn:\n\nKargolarımız ortalama 2-3 iş günü içinde teslim edilir. Türkiye'nin tüm illerine ücretsiz gönderim sağlıyoruz..."}
        />
        <p className="text-xs text-muted-foreground">En az 20, en fazla 100.000 karakter.</p>
      </div>
      <FeedbackBar state={state} />
      <ManualSubmit />
    </form>
  );
}

function ManualSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (<><Loader2 className="h-4 w-4 animate-spin" /> İşleniyor...</>) : (<><Plus className="h-4 w-4" /> Metni eğit</>)}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────
export function FaqSourceForm({ chatbotId }: { chatbotId: string }) {
  const [state, formAction] = useActionState<SourceFormState | null, FormData>(createFaqSourceAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chatbotId" value={chatbotId} />
      <div className="space-y-2">
        <Label htmlFor="faq-title">Başlık</Label>
        <Input id="faq-title" name="title" placeholder="örn. Genel SSS" maxLength={200} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="faq-raw">Soru / Cevap listesi</Label>
        <Textarea
          id="faq-raw"
          name="raw"
          required
          rows={10}
          minLength={20}
          maxLength={100_000}
          placeholder={"Her satıra bir SSS — 'Soru | Cevap' formatında yaz:\n\nKargo kaç günde gelir? | Türkiye'ye 2-3 iş gününde teslim ediyoruz.\nİade süreci nasıl? | 14 gün içinde ücretsiz iade edebilirsiniz.\nÖdeme yöntemleri? | Kredi kartı, havale ve kapıda ödeme kabul ediyoruz."}
        />
        <p className="text-xs text-muted-foreground">
          Format: her satıra bir SSS. <strong>"Soru | Cevap"</strong> (pipe karakteri ile ayır). Alternatif: <strong>"Q: ...\nA: ..."</strong> bloklarını boş satırla ayır.
        </p>
      </div>
      <FeedbackBar state={state} />
      <FaqSubmit />
    </form>
  );
}

function FaqSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (<><Loader2 className="h-4 w-4 animate-spin" /> İşleniyor...</>) : (<><Plus className="h-4 w-4" /> SSS'leri eğit</>)}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sitemap (multi-page crawl)
// ─────────────────────────────────────────────────────────────────────
export function SitemapSourceForm({ chatbotId, maxPages }: { chatbotId: string; maxPages: number }) {
  const [state, formAction] = useActionState<SourceFormState | null, FormData>(createSitemapSourcesAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chatbotId" value={chatbotId} />
      <div className="space-y-2">
        <Label htmlFor="sitemap-url">Sitemap URL</Label>
        <Input id="sitemap-url" name="sitemapUrl" placeholder="https://ornek.com/sitemap.xml" required />
        <p className="text-xs text-muted-foreground">
          Bare domain (örn. <code>ornek.com</code>) verirsen otomatik <code>/sitemap.xml</code> ekler. Sitemap index'leri (alt sitemap'lere yönlenenler) da otomatik takip edilir.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="max-urls">Maks. sayfa</Label>
          <Input id="max-urls" name="maxUrls" type="number" min={1} max={maxPages} defaultValue={Math.min(20, maxPages)} />
          <p className="text-xs text-muted-foreground">Planın sınırı: {maxPages}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="include">İçer (opsiyonel)</Label>
          <Input id="include" name="includePatterns" placeholder="/blog/, /docs/" />
          <p className="text-xs text-muted-foreground">Virgül ile ayır</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exclude">Hariç tut</Label>
          <Input id="exclude" name="excludePatterns" placeholder="/admin, .pdf" />
          <p className="text-xs text-muted-foreground">Virgül ile ayır</p>
        </div>
      </div>
      <FeedbackBar state={state} />
      <SitemapSubmit />
    </form>
  );
}

function SitemapSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sitemap taranıyor + eğitiliyor...</>) : (<><Plus className="h-4 w-4" /> Sitemap'i eğit</>)}
    </Button>
  );
}
