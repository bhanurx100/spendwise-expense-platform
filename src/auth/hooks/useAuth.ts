"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

/**
 * src/auth/hooks/useAuth.ts
 *
 * THE client-side authentication abstraction.
 *
 *   UI  →  useAuth()  →  Authentication Service (this file)  →  Auth.js
 *
 * Components must never import `next-auth/react` directly — always go
 * through this hook, so swapping the underlying provider later only means
 * editing this file.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isDemo: Boolean(session?.user?.isDemo),
    signOut: () => nextAuthSignOut({ callbackUrl: "/sign-in" }),
  };
}
