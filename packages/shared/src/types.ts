// Domain types shared between web app, worker, and widget.

export type Locale = "tr" | "en";

export type PlanId = "free" | "starter" | "pro" | "agency";

export type ChannelType = "web" | "whatsapp" | "telegram" | "slack";

export type MemberRole = "owner" | "admin" | "agent" | "viewer";

export type SourceType =
  | "website" | "pdf" | "docx" | "txt" | "manual" | "faq"
  // Faz 2:
  | "sitemap" | "youtube" | "notion" | "google_docs" | "csv" | "api";

export type SourceStatus = "pending" | "processing" | "completed" | "failed";

export type BotTone = "professional" | "friendly" | "concise" | "sales";

export type AnswerLength = "short" | "normal" | "detailed";

export type MessageRole = "user" | "assistant" | "system";

export type WidgetPosition = "bottom-right" | "bottom-left";

export type ThemeMode = "light" | "dark" | "system";

export interface QuickQuestion {
  label: string;
}

export interface ChatbotPublicConfig {
  id: string;
  name: string;
  businessName: string | null;
  language: "tr" | "en" | "auto";
  primaryColor: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  widgetPosition: WidgetPosition;
  theme: ThemeMode;
  welcomeMessage: string | null;
  quickQuestions: QuickQuestion[];
  showLeadFormOnFallback: boolean;
  showBranding: boolean;     // free plan = true
}

export interface PlanLimits {
  monthlyMessageLimit: number;
  chatbotLimit: number;
  sourceLimit: number;
  fileSizeLimitMb: number;
  teamMembersLimit: number;
  removeBranding: boolean;
  whiteLabel: boolean;
}
