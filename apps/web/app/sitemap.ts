import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://chativo.ai";
  const now = new Date();
  return [
    { url: `${base}/`,        lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/login`,   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/register`,lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
  ];
}
