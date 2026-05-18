import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Supabase Auth callback. Handles:
 *  - email confirmation (code exchange)
 *  - magic link / OAuth (code exchange)
 *  - password reset (code exchange)
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/overview";

  if (code) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const err = new URL("/login", request.url);
      err.searchParams.set("error", "callback_failed");
      return NextResponse.redirect(err);
    }
  }

  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/overview";
  return NextResponse.redirect(new URL(target, request.url));
}
