import { auth } from "@/src/auth/server";
import { NextResponse } from "next/server";

/**
 * middleware.ts
 *
 * Replaces Clerk's `clerkMiddleware` + `createRouteMatcher(["/"])`, which
 * only protected the root route. This protects every route under the
 * (dashboard) group — accounts, categories, transactions, splitpay, and the
 * overview — while leaving (auth) and any future public/onboarding routes
 * open. API routes handle their own auth via `requireHonoUser` (see
 * src/auth/server.ts) since they need JSON 401s, not redirects.
 */
const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAuthPage = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const isPublic =
    isAuthPage ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon");

  // Signed-in users hitting /sign-in should land on the dashboard — avoids
  // a confusing "already in, still on sign-in" state without creating loops
  // (dashboard is protected; auth pages stay public for signed-out users).
  if (isAuthPage && req.auth) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const dest =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (isPublic) return NextResponse.next();

  // API routes: let the route handler return its own 401 JSON via
  // requireHonoUser — a redirect here would break fetch/XHR callers.
  if (pathname.startsWith("/api")) return NextResponse.next();

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
