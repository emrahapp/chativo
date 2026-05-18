"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ArrowRight, Sun, Moon, Monitor, AlignLeft, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioCardGroup } from "@/components/ui/radio-card";
import { LivePreview } from "./live-preview";
import { saveAppearanceAction, type FormState } from "@/app/actions/chatbots";
import type { ChatbotRecord } from "@/lib/chatbots/repo";

const POSITIONS = [
  { value: "bottom-right", label: "Sağ Alt",  icon: <AlignRight className="h-4 w-4" /> },
  { value: "bottom-left",  label: "Sol Alt",  icon: <AlignLeft className="h-4 w-4" /> },
];
const THEMES = [
  { value: "light",  label: "Açık",   icon: <Sun className="h-4 w-4" /> },
  { value: "dark",   label: "Koyu",   icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "Sistem", icon: <Monitor className="h-4 w-4" /> },
];

const PALETTE = ["#6554E8", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#0F172A"];

export function StepAppearanceForm({ chatbot }: { chatbot: ChatbotRecord }) {
  const [state, formAction] = useActionState<FormState | null, FormData>(saveAppearanceAction, null);
  const [color, setColor] = useState(chatbot.primary_color);
  const [position, setPosition] = useState(chatbot.widget_position);
  const [theme, setTheme] = useState(chatbot.theme);
  const [welcome, setWelcome] = useState(chatbot.welcome_message ?? "");
  const [quickQs, setQuickQs] = useState(
    chatbot.quick_questions.map((q) => q.label).join("\n")
  );

  const quickParsed = quickQs.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="chatbotId" value={chatbot.id} />

        <div className="space-y-2">
          <Label>Widget ana rengi</Label>
          <div className="flex items-center gap-3">
            <input type="hidden" name="primaryColor" value={color} />
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Renk ${c}`}
                  onClick={() => setColor(c)}
                  className={"h-8 w-8 rounded-full ring-offset-2 transition-all " + (color === c ? "ring-2 ring-brand-500 scale-110" : "ring-0")}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                aria-label="Özel renk"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <span className="text-xs font-mono text-muted-foreground">{color.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bubble pozisyonu</Label>
          <input type="hidden" name="widgetPosition" value={position} />
          <RadioCardGroup name="position-radio" options={POSITIONS} value={position} onChange={(v) => setPosition(v as typeof position)} columns={2} />
        </div>

        <div className="space-y-2">
          <Label>Tema</Label>
          <input type="hidden" name="theme" value={theme} />
          <RadioCardGroup name="theme-radio" options={THEMES} value={theme} onChange={(v) => setTheme(v as typeof theme)} columns={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">İlk açılış mesajı</Label>
          <Input
            id="welcomeMessage"
            name="welcomeMessage"
            value={welcome}
            onChange={(e) => setWelcome(e.target.value)}
            placeholder="Merhaba 👋 Size nasıl yardımcı olabilirim?"
            maxLength={300}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quickQuestions">Hızlı soru önerileri</Label>
          <Textarea
            id="quickQuestions"
            name="quickQuestions"
            value={quickQs}
            onChange={(e) => setQuickQs(e.target.value)}
            placeholder="Kargo süresi kaç gün?&#10;İade süreci nasıl?&#10;Nasıl iletişime geçebilirim?"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">Her satıra bir öneri. En fazla 6 tane.</p>
        </div>

        {state?.error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="ghost">
            <Link href={`/chatbots/${chatbot.id}/setup?step=behavior`}>Geri</Link>
          </Button>
          <SubmitButton />
        </div>
      </form>

      <div className="hidden lg:block">
        <LivePreview
          config={{
            botName: chatbot.name,
            primaryColor: color,
            welcomeMessage: welcome || "Merhaba 👋 Size nasıl yardımcı olabilirim?",
            quickQuestions: quickParsed.map((label) => ({ label })),
            theme: theme,
          }}
        />
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" variant="gradient">
      {pending ? "Kaydediliyor..." : "Test'e Geç"}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}
