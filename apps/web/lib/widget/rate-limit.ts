import "server-only";

/**
 * Token-bucket-ish in-memory rate limiter.
 *
 * MVP-only — works in a single Node process. For horizontal scale, swap with
 * @upstash/ratelimit (already in deps, env not yet wired). The function
 * signature stays compatible.
 */

interface Bucket {
  windowStartMs: number;
  count: number;
}

const stores = new Map<string, Map<string, Bucket>>();

interface CheckOpts {
  namespace: string;     // distinct namespace per limit kind ('msg-ip', 'msg-visitor')
  key: string;           // e.g. an IP or visitor_id
  limit: number;         // max events per window
  windowMs: number;      // window length
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;       // ms epoch
}

export function checkRate(opts: CheckOpts): RateLimitResult {
  const now = Date.now();
  let ns = stores.get(opts.namespace);
  if (!ns) {
    ns = new Map();
    stores.set(opts.namespace, ns);
  }

  let bucket = ns.get(opts.key);
  if (!bucket || now - bucket.windowStartMs >= opts.windowMs) {
    bucket = { windowStartMs: now, count: 0 };
    ns.set(opts.key, bucket);
  }

  if (bucket.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.windowStartMs + opts.windowMs,
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: opts.limit - bucket.count,
    resetAt: bucket.windowStartMs + opts.windowMs,
  };
}

// Garbage-collect every 5 minutes to keep memory bounded.
let gcStarted = false;
function startGc() {
  if (gcStarted) return;
  gcStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [, ns] of stores) {
      for (const [k, b] of ns) {
        if (now - b.windowStartMs > 60 * 60 * 1000) ns.delete(k); // 1h max
      }
    }
  }, 5 * 60 * 1000).unref?.();
}
startGc();

/** Convenience: pull a client IP from request headers (works behind Vercel). */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
