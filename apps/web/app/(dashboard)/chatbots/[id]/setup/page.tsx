import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getChatbot } from "@/lib/chatbots/repo";
import { PageHeader } from "@/components/dashboard/page-header";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { buildSteps, type WizardStepKey } from "@/components/wizard/stepper";
import { LivePreview } from "@/components/wizard/live-preview";
import { StepSources } from "@/components/wizard/step-sources";
import { StepBehaviorForm } from "@/components/wizard/step-behavior-form";
import { StepAppearanceForm } from "@/components/wizard/step-appearance-form";
import { StepTest } from "@/components/wizard/step-test";
import { StepPublishForm } from "@/components/wizard/step-publish-form";

export const metadata = { title: "Chatbot Kurulumu" };

const STEP_TITLES: Record<WizardStepKey, { title: string; description: string }> = {
  info:       { title: "Adım 1 · Bilgiler",        description: "Botun temel kimliğini belirle." },
  sources:    { title: "Adım 2 · Veri Kaynakları", description: "Botunu eğitecek bilgi kaynaklarını ekle." },
  behavior:   { title: "Adım 3 · Davranış",        description: "Bot tonu, cevap stili ve güvenlik tercihleri." },
  appearance: { title: "Adım 4 · Görünüm",         description: "Widget'ın markana özel görünümü." },
  test:       { title: "Adım 5 · Test Et",         description: "Botu canlı yayına almadan dene." },
  publish:    { title: "Adım 6 · Yayına Al",       description: "Embed kodunu al ve sitende çalıştır." },
};

export default async function ChatbotSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: WizardStepKey }>;
}) {
  const { id } = await params;
  const { step: stepRaw } = await searchParams;
  const step: WizardStepKey =
    stepRaw && ["info", "sources", "behavior", "appearance", "test", "publish"].includes(stepRaw)
      ? stepRaw
      : "sources";

  const chatbot = await getChatbot(id);
  if (!chatbot) notFound();

  const steps = buildSteps(chatbot.id, step);
  const meta = STEP_TITLES[step];

  const previewConfig = {
    botName: chatbot.name,
    primaryColor: chatbot.primary_color,
    welcomeMessage: chatbot.welcome_message ?? "Merhaba 👋 Size nasıl yardımcı olabilirim?",
    quickQuestions: chatbot.quick_questions ?? [],
    theme: chatbot.theme,
  };

  const showPreview = step !== "appearance" && step !== "publish";   // appearance has its own; publish shows code

  return (
    <>
      <PageHeader
        title={chatbot.name}
        description={`Bot durumu: ${chatbot.is_active ? "Aktif" : "Kurulumda"}`}
        actions={
          <Link href={`/chatbots/${chatbot.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
            Bot detayına dön
          </Link>
        }
      />

      <WizardShell
        steps={steps}
        title={meta.title}
        description={meta.description}
        preview={showPreview ? <LivePreview config={previewConfig} /> : undefined}
      >
        {step === "sources" && <StepSources chatbot={chatbot} />}
        {step === "behavior" && <StepBehaviorForm chatbot={chatbot} />}
        {step === "appearance" && <StepAppearanceForm chatbot={chatbot} />}
        {step === "test" && <StepTest chatbot={chatbot} />}
        {step === "publish" && (
          <StepPublishForm
            chatbot={chatbot}
            appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
          />
        )}
      </WizardShell>
    </>
  );
}
