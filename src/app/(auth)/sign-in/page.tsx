"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthWorkspace } from "@/src/auth/components/ui/AuthWorkspace";
import { AuthExperience } from "@/src/auth/components/AuthExperience";

/**
 * src/app/(auth)/sign-in/page.tsx
 *
 * This route is now just the entry point into ONE continuous experience —
 * all the actual state (method choice, the "about" panel, success) lives
 * in <AuthExperience>, which never itself navigates between routes. This
 * page's only job is reading the two real query params Auth.js/middleware
 * already produce (`callbackUrl`, `error`) and handing them down.
 *
 * Same two underlying sign-in calls as every previous pass — Google OAuth
 * and the demo Credentials provider — nothing about what authenticates a
 * user changed here; see AUTH_UI_REDESIGN.md for the full account of what
 * did and didn't change, and why there's no Sign Up / Forgot Password /
 * Verification route: none of those exist in this project's Auth.js
 * config, so there's nothing real to redesign for them.
 */
function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorCode = searchParams.get("error");

  return (
    <AuthWorkspace>
      <AuthExperience callbackUrl={callbackUrl} initialErrorCode={errorCode} />
    </AuthWorkspace>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" aria-hidden="true" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
