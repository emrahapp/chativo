import "server-only";
import type { BotAction } from "./types";

/**
 * Execute a bot action with LLM-provided arguments.
 * Returns the raw response (truncated) which we feed back into the LLM.
 *
 * Security:
 *  - 10s timeout
 *  - Max 50KB response (truncate)
 *  - URL must be https (no localhost/internal IPs — SSRF guard)
 */
export async function executeAction(action: BotAction, args: Record<string, unknown>): Promise<{
  ok: boolean;
  status?: number;
  body: string;
  error?: string;
}> {
  // SSRF guard
  if (!/^https:\/\//i.test(action.url)) {
    return { ok: false, body: "", error: "Action URL must be https://" };
  }
  const u = new URL(interpolate(action.url, args));
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || /^(10\.|192\.168\.|127\.|169\.254\.)/.test(host)) {
    return { ok: false, body: "", error: "Private/loopback URLs not allowed" };
  }

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(action.headers ?? {})) {
    headers[k] = interpolate(v, args);
  }
  if (action.method !== "GET" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const body = action.method === "GET"
    ? undefined
    : (action.bodyTemplate ? interpolate(action.bodyTemplate, args) : JSON.stringify(args));

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 10_000);
  try {
    const res = await fetch(u.toString(), {
      method: action.method,
      headers,
      body,
      signal: ac.signal,
    });
    const text = (await res.text()).slice(0, 50_000);
    return { ok: res.ok, status: res.status, body: text };
  } catch (err) {
    return { ok: false, body: "", error: err instanceof Error ? err.message : "fetch failed" };
  } finally {
    clearTimeout(t);
  }
}

function interpolate(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
    const v = args[name];
    return v === undefined || v === null ? "" : String(v);
  });
}
