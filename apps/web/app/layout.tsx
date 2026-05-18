import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { detectLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Chativo — AI Support Agent for Your Website",
    template: "%s · Chativo",
  },
  description:
    "Add an AI support agent trained on your business to your website. Train with your URL, files and FAQs in minutes.",
  applicationName: "Chativo",
  authors: [{ name: "Chativo" }],
  openGraph: {
    type: "website",
    title: "Chativo — AI Support Agent",
    description: "Add an AI support agent trained on your business to your website.",
    siteName: "Chativo",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#6554E8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
