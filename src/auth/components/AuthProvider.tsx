"use client";

import { SessionProvider } from "next-auth/react";
import type { PropsWithChildren } from "react";

/**
 * src/auth/components/AuthProvider.tsx
 *
 * Drop-in replacement for Clerk's <ClerkProvider>. Kept as its own
 * component (rather than importing SessionProvider directly in
 * app/layout.tsx) so the rest of the app depends on "AuthProvider", not on
 * next-auth by name.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>;
}
