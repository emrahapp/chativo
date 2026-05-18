import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness / readiness probe.
 * Returns 200 if Supabase is reachable, 503 otherwise.
 * Use this as the URL behind your uptime monitor (UptimeRobot, BetterUptime, etc).
 */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("plans").select("id").limit(1);
    dbOk = !error;
    if (error) dbError = error.message;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const body = {
    ok: dbOk,
    service: "chativo-web",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    region: process.env.VERCEL_REGION ?? "local",
    db: dbOk ? "ok" : "fail",
    dbError,
    latencyMs: Date.now() - started,
    ts: new Date().toISOString(),
  };

  return Response.json(body, {
    status: dbOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
