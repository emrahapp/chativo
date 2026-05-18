import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@chativo/db";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use in: Server Components, Route Handlers, Server Actions.
 *
 * Honors RLS — calls run as the authenticated user.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component reads can't set cookies — safely ignored
            // because middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Use only in:
 *   - admin API routes that have already verified caller is admin
 *   - public widget endpoints that must write across tenants
 *   - background workers
 * NEVER pass this to the browser.
 */
import { createClient } from "@supabase/supabase-js";

let _admin: ReturnType<typeof createClient<Database>> | null = null;
export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin called on the client — refusing");
  }
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}
