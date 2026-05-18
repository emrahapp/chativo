import "server-only";
import type { ExtractResult } from "./extract";

/**
 * Extracts text from a binary file Buffer based on MIME type.
 * Supports PDF (pdf-parse), DOCX (mammoth), TXT (utf-8 decode).
 *
 * pdf-parse is a CommonJS module; we require() it dynamically so Next.js's
 * server bundler doesn't try to inline a debug-mode test fixture path.
 */
export async function extractFromFile(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ExtractResult> {
  const { filename, mimeType, buffer } = args;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (mimeType === "application/pdf" || ext === "pdf") {
    return extractPdf(buffer, filename);
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return extractDocx(buffer, filename);
  }
  if (mimeType === "text/plain" || ext === "txt" || ext === "md") {
    return extractTxt(buffer, filename);
  }
  throw new Error(`Desteklenmeyen dosya türü: ${mimeType || ext}`);
}

async function extractPdf(buffer: Buffer, filename: string): Promise<ExtractResult> {
  // Avoid the package's index.js which reads a test PDF at import time.
  // The actual implementation lives in lib/pdf-parse.js.
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse: (b: Buffer) => Promise<{ text: string; numpages: number; info: any }> =
    mod.default ?? mod;
  const parsed = await pdfParse(buffer);
  const text = clean(parsed.text);
  return {
    title: filename.replace(/\.pdf$/i, ""),
    text,
    byteCount: Buffer.byteLength(text, "utf8"),
  };
}

async function extractDocx(buffer: Buffer, filename: string): Promise<ExtractResult> {
  const mammoth: any = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = clean(result.value as string);
  return {
    title: filename.replace(/\.docx$/i, ""),
    text,
    byteCount: Buffer.byteLength(text, "utf8"),
  };
}

function extractTxt(buffer: Buffer, filename: string): ExtractResult {
  const text = clean(buffer.toString("utf8"));
  return {
    title: filename.replace(/\.(txt|md)$/i, ""),
    text,
    byteCount: Buffer.byteLength(text, "utf8"),
  };
}

function clean(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * MIME type → DB enum (matches source_type in 0001_init.sql).
 * Falls back to `txt` for plain text variants.
 */
export function sourceTypeFromMime(mimeType: string, filename: string): "pdf" | "docx" | "txt" {
  if (mimeType === "application/pdf" || /\.pdf$/i.test(filename)) return "pdf";
  if (/\.docx$/i.test(filename) || mimeType.includes("wordprocessingml")) return "docx";
  return "txt";
}
