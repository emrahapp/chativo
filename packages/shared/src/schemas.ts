import { z } from "zod";

// ── Auth ─────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80).optional(),
  locale: z.enum(["tr", "en"]).default("tr"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Chatbot ──────────────────────────────────────────────────
export const ChatbotCreateSchema = z.object({
  name: z.string().min(1).max(80),
  businessName: z.string().max(120).optional(),
  language: z.enum(["tr", "en", "auto"]).default("auto"),
  purpose: z.string().max(80).default("support"),
  tone: z.enum(["professional", "friendly", "concise", "sales"]).default("friendly"),
  answerLength: z.enum(["short", "normal", "detailed"]).default("normal"),
  welcomeMessage: z.string().max(500).optional(),
  fallbackMessage: z.string().max(500).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default("#6554E8"),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  quickQuestions: z.array(z.object({ label: z.string().min(1).max(60) })).max(6).default([]),
  strictKnowledgeBase: z.boolean().default(true),
  showLeadFormOnFallback: z.boolean().default(true),
  allowedDomains: z.array(z.string()).default([]),
});

export const ChatbotUpdateSchema = ChatbotCreateSchema.partial();

// ── Sources ──────────────────────────────────────────────────
export const SourceUrlSchema = z.object({
  url: z.string().url(),
  title: z.string().max(200).optional(),
});

export const SourceManualSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
});

export const SourceFaqSchema = z.object({
  title: z.string().min(1).max(200),
  items: z.array(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
  })).min(1).max(200),
});

// ── Widget chat ──────────────────────────────────────────────
export const WidgetMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  visitorId: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  locale: z.enum(["tr", "en"]).optional(),
});

export const WidgetLeadSchema = z.object({
  conversationId: z.string().uuid(),
  visitorId: z.string().min(1).max(100),
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
}).refine(d => d.email || d.phone, { message: "email or phone required" });

export const WidgetRatingSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  rating: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});
