import "server-only";

export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;       // approximate, char/4 heuristic — exact tokens come from OpenAI
  metadata?: Record<string, unknown>;
}

const TARGET_TOKENS = 800;
const OVERLAP_TOKENS = 100;
const CHARS_PER_TOKEN = 4;          // rough English/Turkish average
const MAX_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;      // ~3200
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN; // ~400

/**
 * Recursive character splitter. Prefers boundaries: \n\n > \n > . ! ? > space > anywhere.
 * Produces overlapping chunks suitable for embedding + retrieval.
 */
export function chunkText(text: string, baseMetadata: Record<string, unknown> = {}): Chunk[] {
  const clean = text.trim();
  if (!clean) return [];

  if (clean.length <= MAX_CHARS) {
    return [{ index: 0, content: clean, tokenCount: estTokens(clean), metadata: baseMetadata }];
  }

  const segments = splitWithOverlap(clean);
  return segments.map((content, index) => ({
    index,
    content,
    tokenCount: estTokens(content),
    metadata: baseMetadata,
  }));
}

function splitWithOverlap(text: string): string[] {
  const out: string[] = [];
  let cursor = 0;
  const len = text.length;

  while (cursor < len) {
    let end = Math.min(cursor + MAX_CHARS, len);

    // If we're not at the end of the document, try to back up to a boundary
    if (end < len) {
      const slice = text.slice(cursor, end);
      const boundary = findBoundary(slice, MAX_CHARS - OVERLAP_CHARS);
      if (boundary > 0) end = cursor + boundary;
    }

    out.push(text.slice(cursor, end).trim());
    if (end >= len) break;
    cursor = Math.max(end - OVERLAP_CHARS, cursor + 1);
  }

  return out.filter(Boolean);
}

function findBoundary(slice: string, minStart: number): number {
  // Search backwards from the end for the highest-priority boundary.
  const priorities = ["\n\n", "\n", ". ", "? ", "! ", " "];
  for (const sep of priorities) {
    const idx = slice.lastIndexOf(sep);
    if (idx >= minStart) return idx + sep.length;
  }
  return slice.length;
}

function estTokens(s: string): number {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}
