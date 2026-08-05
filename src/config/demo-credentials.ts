/**
 * src/config/demo-credentials.ts
 *
 * The one canonical demo identity for SplitFin. Both the runtime auth
 * provider (`src/auth/demo-service.ts`) and the seed script
 * (`src/scripts/seed/core/demo-identities.seed.ts`) import from here instead
 * of each hardcoding the same email/password — previously they defined the
 * same values independently, which meant changing the demo password in one
 * place silently desynced it from the other (auth would accept a password
 * the seed script's printed login instructions no longer matched, or vice
 * versa).
 *
 * `userId` is the deterministic id the seed script inserts the demo user
 * row under (see DEMO_USER_SLUG in scripts/seed/lib/constants.ts) — kept
 * here too so auth-side code can reference it without importing a
 * script-only module.
 */

export const DEMO_ACCOUNT = {
  userId: "demo_user",
  email: "demo@splitfin.app",
  password: "demo123",
} as const;