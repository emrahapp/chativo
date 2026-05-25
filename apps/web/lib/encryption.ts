import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Symmetric encryption for BYOK / 3rd party credentials at rest.
 * Uses AES-256-GCM with a 32-byte key derived from ENCRYPTION_KEY env.
 *
 * Output format: base64(iv | authTag | ciphertext)
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;       // GCM standard
const AUTH_TAG_LENGTH = 16;

let _key: Buffer | null = null;
function getKey(): Buffer {
  if (_key) return _key;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY env not set (need 64 hex chars / 32 bytes)");
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    _key = Buffer.from(raw, "hex");
  } else {
    // Fallback: derive from any string. Less ideal but works.
    _key = scryptSync(raw, "chativo-byok-salt", 32);
  }
  return _key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

/** Safe-fallback: returns plaintext masked as `sk-•••…last4` for display. */
export function maskSecret(s: string, keepLast = 4): string {
  if (!s) return "";
  if (s.length <= keepLast) return "•".repeat(s.length);
  return "•".repeat(Math.min(8, s.length - keepLast)) + s.slice(-keepLast);
}
