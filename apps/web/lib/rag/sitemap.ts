import "server-only";

/**
 * Minimal sitemap parser. Handles:
 *  - Plain sitemap.xml with <url><loc>...</loc></url>
 *  - Sitemap index that points to other sitemaps (recurse, limit depth)
 *
 * Returns a deduped list of URLs (capped at maxUrls).
 */

interface SitemapOpts {
  url: string;
  maxUrls?: number;
  include?: string[];   // substring filters (any match)
  exclude?: string[];   // substring filters (any match)
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RECURSE = 5;

export async function fetchSitemap(opts: SitemapOpts): Promise<string[]> {
  const { url, maxUrls = 50, include = [], exclude = [] } = opts;

  const seen = new Set<string>();
  const out: string[] = [];

  async function visit(target: string, depth: number) {
    if (depth > MAX_RECURSE || out.length >= maxUrls) return;

    const xml = await fetchText(target);
    const isIndex = /<sitemapindex/i.test(xml);
    const locs = extractLocs(xml);

    if (isIndex) {
      for (const child of locs) {
        if (out.length >= maxUrls) break;
        try { await visit(child, depth + 1); } catch { /* skip bad children */ }
      }
      return;
    }

    for (const loc of locs) {
      if (out.length >= maxUrls) break;
      if (seen.has(loc)) continue;
      if (include.length && !include.some((s) => loc.includes(s))) continue;
      if (exclude.length && exclude.some((s) => loc.includes(s))) continue;
      seen.add(loc);
      out.push(loc);
    }
  }

  await visit(normalizeSitemapUrl(url), 0);
  return out;
}

async function fetchText(url: string): Promise<string> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Chativo-Bot/1.0 (+https://chativo.ai/bot)",
        Accept: "application/xml, text/xml, */*",
      },
    });
    if (!res.ok) throw new Error(`sitemap fetch ${res.status}: ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc[^>]*>([^<]+)<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (raw) out.push(decodeEntities(raw));
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeSitemapUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  // If user gives a bare domain, append /sitemap.xml
  try {
    const url = new URL(u);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/sitemap.xml";
      return url.toString();
    }
  } catch { /* ignore */ }
  return u;
}
