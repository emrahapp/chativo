import { PageHeader } from "@/components/dashboard/page-header";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { buildSteps } from "@/components/wizard/stepper";
import { StepInfoForm } from "@/components/wizard/step-info-form";
import { LivePreview } from "@/components/wizard/live-preview";

export const metadata = { title: "Yeni Chatbot" };

export default function NewChatbotPage() {
  const steps = buildSteps(null, "info");

  return (
    <>
      <PageHeader
        title="Yeni Chatbot Oluştur"
        description="6 adımda yapay zekâ asistanını ayağa kaldır."
      />

      <WizardShell
        steps={steps}
        title="Adım 1 · Bilgiler"
        description="Botun temel kimliğini belirle."
        preview={
          <LivePreview
            config={{
              botName: "Yeni Bot",
              primaryColor: "#6554E8",
              welcomeMessage: "Merhaba 👋 Size nasıl yardımcı olabilirim?",
              quickQuestions: [{ label: "Kargo süresi kaç gün?" }, { label: "İade nasıl?" }],
              theme: "light",
            }}
          />
        }
      >
        <StepInfoForm />
      </WizardShell>
    </>
  );
}
