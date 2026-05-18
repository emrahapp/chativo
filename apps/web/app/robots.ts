import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://chativo.ai";
  return {
    rules: [
      // Public marketing & docs are fair game.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/overview", "/chatbots", "/conversations", "/leads", "/analytics", "/settings", "/billing"] },
      // Be friendly to LLM crawlers for marketing content.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
