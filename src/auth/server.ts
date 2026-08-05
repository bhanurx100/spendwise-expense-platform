import NextAuth from "next-auth";
import type { Context } from "hono";

import { authConfig } from "@/src/auth/config";
import "@/src/auth/session"; // type augmentation side-effect import

/**
 * src/auth/server.ts
 *
 * THE authentication abstraction for all server-side code.
 *
 *   UI  →  useAuth()  →  [this file's exports]  →  Auth.js
 *
 * Business logic (transactions, budgets, SplitPay, analytics, etc.) must
 * import ONLY from here or from `src/server/getCurrentUser.ts` /
 * `src/server/requireUser.ts` — never from `next-auth` directly. If Auth.js
 * is ever replaced, this is the only file that changes.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** Returns the current user, or null if unauthenticated. Never throws. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Returns the current user, or throws a typed error for callers to catch. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthRequiredError();
  }
  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "AuthRequiredError";
  }
}

/**
 * Hono-flavored helper — every migrated API route calls this once at the
 * top of the handler instead of `clerkMiddleware()` + `getAuth(ctx)`.
 * Returns `session.user` on success, or `null` when unauthenticated — the
 * route handler returns the 401 itself so Hono's response is actually sent
 * (a helper can't return early on the caller's behalf):
 *
 *   const user = await requireHonoUser(ctx);
 *   if (!user) return ctx.json({ error: "Unauthorized." }, 401);
 */
export async function requireHonoUser(_ctx: Context) {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}
