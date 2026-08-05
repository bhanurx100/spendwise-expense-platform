"use client";

import { useAuth } from "@/src/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { SessionGateSkeleton } from "./ui/SessionGateSkeleton";

/**
 * src/auth/components/ProtectedRoute.tsx
 *
 * Logic is byte-for-byte the same guard as before: root middleware.ts
 * already blocks unauthenticated requests to every (dashboard) route
 * server-side; this exists for the same client-only edge case it always
 * did. The only change is presentation — SessionGateSkeleton replaces the
 * bare spinner (see src/auth/components/ui/SessionGateSkeleton.tsx).
 */
export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <SessionGateSkeleton />;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
