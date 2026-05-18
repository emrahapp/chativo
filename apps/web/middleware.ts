import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/overview", "/chatbots", "/knowledge", "/conversations", "/leads", "/analytics", "/settings", "/billing", "/admin"];
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;

  // Already signed in → bounce auth pages to /overview
  if (user && AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // Not signed in → bounce protected to /login (preserve next)
  if (!user && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static files, /widget.js, /api/widget/*, and the auth callback.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|widget\\.js|api/widget|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
