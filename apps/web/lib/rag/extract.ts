import "server-only";
import * as cheerio from "cheerio";

const MAX_HTML_BYTES = 5 * 1024 * 1024;   // 5MB max page size
const FETCH_TIMEOUT_MS = 15_000;

export interface ExtractResult {
  title: string | null;
  text: string;
  byteCount: number;
}

/**
 * Fetches a URL, strips chrome (nav, footer, scripts), and returns clean text.
 * Used for the "website URL" knowledge source type.
 */
export async function extractFromUrl(rawUrl: string): Promise<ExtractResult> {
  const url = normalizeUrl(rawUrl);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Chativo-Bot/1.0 (+https://chativo.ai/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`URL fetch failed (${res.status}): ${url}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(contentType)) {
    throw new Error(`Beklenen HTML değil: ${contentType}`);
  }

  const raw = await res.text();
  if (raw.length > MAX_HTML_BYTES) {
    throw new Error("Sayfa çok büyük (5MB üstü).");
  }

  return extractFromHtml(raw);
}

/** Same cleaning logic but takes raw HTML string. */
export function extractFromHtml(html: string): ExtractResult {
  const $ = cheerio.load(html);

  // Strip junk
  $("script, style, noscript, iframe, svg, nav, footer, header, aside, form").remove();
  $("[role=navigation], [role=banner], [role=contentinfo]").remove();

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || null;

  // Prefer <main> or <article> if present; otherwise <body>.
  const root = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  const text = collapseWhitespace(root.text());

  return {
    title: title || null,
    text,
    byteCount: Buffer.byteLength(text, "utf8"),
  };
}

/** Manual / pasted text: just clean + measure. */
export function extractFromText(raw: string, title: string): ExtractResult {
  const text = collapseWhitespace(raw);
  return { title, text, byteCount: Buffer.byteLength(text, "utf8") };
}

/** Formats an FAQ list as text suitable for chunking + retrieval. */
export function extractFromFaq(
  items: { question: string; answer: string }[],
  title: string
): ExtractResult {
  const text = items
    .map((it, i) => `Q${i + 1}: ${it.question.trim()}\nA: ${it.answer.trim()}`)
    .join("\n\n");
  return { title, text, byteCount: Buffer.byteLength(text, "utf8") };
}

// ─────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────
function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function collapseWhitespace(s: string): string {
  return s
    .replace(/ /g, " ")               // nbsp
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
