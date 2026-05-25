import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/overview", "/chatbots", "/knowledge", "/conversations",
  "/leads", "/analytics", "/settings", "/billing", "/admin",
];
const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

function needsAuthCheck(pathname: string): boolean {
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth round-trip entirely for public/api/widget paths.
  // This saves ~150-200ms per non-protected request (e.g. /, /api/health, /api/widget/*).
  if (!needsAuthCheck(pathname)) {
    return NextResponse.next();
  }

  const { response, user } = await updateSupabaseSession(request);

  if (user && AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }
  if (!user && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Only run middleware on paths where auth might matter. Static files,
  // /widget.js, /api/widget/*, and auth callback all skip entirely.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|widget\\.js|api/widget|api/health|api/auth/callback|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
