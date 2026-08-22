import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * middleware.ts
 *
 * Minimal middleware that ensures API auth routes and public files are accessible.
 * Auth gating for dashboard pages is handled by the ProtectedRoute component.
 */
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files, _next, favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.match(/\.[\w]+$/)
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
