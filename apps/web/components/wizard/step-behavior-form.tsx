"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ArrowRight, Briefcase, Smile, Zap, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioCardGroup } from "@/components/ui/radio-card";
import { saveBehaviorAction, type FormState } from "@/app/actions/chatbots";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

const TONES = [
  { value: "professional", label: "Profesyonel", description: "Kurumsal, kibar.", icon: <Briefcase className="h-4 w-4" /> },
  { value: "friendly",     label: "Samimi",      description: "Sıcak, sohbet.",   icon: <Smile className="h-4 w-4" /> },
  { value: "concise",      label: "Kısa & Net",  description: "Hızlı cevap.",     icon: <Zap className="h-4 w-4" /> },
  { value: "sales",        label: "Satış Odaklı",description: "İkna edici.",      icon: <Tag className="h-4 w-4" /> },
];

const LENGTHS = [
  { value: "short",    label: "Kısa",    description: "1-2 cümle." },
  { value: "normal",   label: "Normal",  description: "2-4 cümle." },
  { value: "detailed", label: "Detaylı", description: "5+ cümle." },
];

export function StepBehaviorForm({ chatbot }: { chatbot: ChatbotRecord }) {
  const [state, formAction] = useActionState<FormState | null, FormData>(saveBehaviorAction, null);
  const [tone, setTone] = useState(chatbot.tone);
  const [length, setLength] = useState(chatbot.answer_length);
  const [strict, setStrict] = useState(chatbot.strict_knowledge_base);
  const [leadForm, setLeadForm] = useState(chatbot.show_lead_form_on_fallback);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="chatbotId" value={chatbot.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="welcomeMessage">Karşılama mesajı</Label>
          <Textarea
            id="welcomeMessage"
            name="welcomeMessage"
            defaultValue={chatbot.welcome_message ?? ""}
            maxLength={500}
            placeholder="Merhaba 👋 Size nasıl yardımcı olabilirim?"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fallbackMessage">Cevap bulamayınca</Label>
          <Textarea
            id="fallbackMessage"
            name="fallbackMessage"
            defaultValue={chatbot.fallback_message ?? ""}
            maxLength={500}
            placeholder="Bu konuda net bilgi bulamadım..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bot tonu</Label>
        <input type="hidden" name="tone" value={tone} />
        <RadioCardGroup name="tone-radio" options={TONES} value={tone} onChange={(v) => setTone(v as typeof tone)} columns={4} />
      </div>

      <div className="space-y-2">
        <Label>Cevap uzunluğu</Label>
        <input type="hidden" name="answerLength" value={length} />
        <RadioCardGroup name="length-radio" options={LENGTHS} value={length} onChange={(v) => setLength(v as typeof length)} columns={3} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
        <ToggleRow
          name="strictKnowledgeBase"
          label="Sadece bilgi tabanına göre cevap ver"
          description="Bot bilgi tabanında olmayan konularda uydurma yapmaz."
          checked={strict}
          onChange={setStrict}
        />
        <ToggleRow
          name="showLeadFormOnFallback"
          label="Cevap bulamazsa lead formu göster"
          description="Cevap bulamadığında iletişim formu otomatik açılır."
          checked={leadForm}
          onChange={setLeadForm}
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button asChild variant="ghost">
          <Link href={`/chatbots/${chatbot.id}/setup?step=sources`}>Geri</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function ToggleRow({
  name, label, description, checked, onChange,
}: {
  name: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" variant="gradient">
      {pending ? "Kaydediliyor..." : "Görünüm'e Geç"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}
