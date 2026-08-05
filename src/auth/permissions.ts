import type { Session } from "next-auth";

/**
 * src/auth/permissions.ts
 *
 * Stub for future authorization needs (2FA gating, trusted-device checks,
 * security-center features). Nothing in the app calls this yet — it exists
 * so those features slot in here later without inventing a new pattern.
 */
export function canAccessSecurityCenter(user: Session["user"] | null) {
  return Boolean(user);
}

export function isDemoUser(user: Session["user"] | null) {
  return Boolean(user?.isDemo);
}
