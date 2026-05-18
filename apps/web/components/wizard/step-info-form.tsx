"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, Headphones, ShoppingBag, UserPlus, HelpCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCardGroup } from "@/components/ui/radio-card";
import { createChatbotAction, type FormState } from "@/app/actions/chatbots";

const PURPOSES = [
  { value: "support", label: "Müşteri Desteği", description: "Soruları yanıtla ve yönlendir.", icon: <Headphones className="h-4 w-4" /> },
  { value: "sales",   label: "Satış Asistanı",  description: "Ürün/hizmet sat ve dönüşüm artır.", icon: <ShoppingBag className="h-4 w-4" /> },
  { value: "lead",    label: "Lead Toplama",    description: "İletişim bilgisi topla.", icon: <UserPlus className="h-4 w-4" /> },
  { value: "faq",     label: "SSS Botu",        description: "Tek konuya odaklan.", icon: <HelpCircle className="h-4 w-4" /> },
  { value: "general", label: "Genel Asistan",   description: "Karma kullanım.", icon: <Globe className="h-4 w-4" /> },
] as const;

const LANGUAGES = [
  { value: "auto", label: "Otomatik" },
  { value: "tr",   label: "Türkçe" },
  { value: "en",   label: "İngilizce" },
] as const;

export function StepInfoForm() {
  const [state, formAction] = useActionState<FormState | null, FormData>(createChatbotAction, null);
  const [purpose, setPurpose] = useState<string>("support");
  const [language, setLanguage] = useState<string>("auto");

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Bot adı *</Label>
          <Input id="name" name="name" required placeholder="örn. E-Ticaret Asistanı" maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">İşletme adı</Label>
          <Input id="businessName" name="businessName" placeholder="örn. Chativo" maxLength={120} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bot dili</Label>
        <input type="hidden" name="language" value={language} />
        <RadioCardGroup
          name="language-radio"
          options={LANGUAGES as unknown as { value: string; label: string }[]}
          value={language}
          onChange={setLanguage}
          columns={3}
        />
        <p className="text-xs text-muted-foreground">
          Otomatik seçilirse bot ziyaretçinin diline göre cevap verir.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Bot amacı</Label>
        <input type="hidden" name="purpose" value={purpose} />
        <RadioCardGroup
          name="purpose-radio"
          options={PURPOSES as unknown as { value: string; label: string; description?: string; icon?: React.ReactNode }[]}
          value={purpose}
          onChange={setPurpose}
          columns={3}
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" variant="gradient">
      {pending ? "Oluşturuluyor..." : "Devam Et"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}
