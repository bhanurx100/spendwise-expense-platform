/**
 * scripts/seed/core/demo-identities.seed.ts
 *
 * Internal demo identities only. These are never routed through Google
 * OAuth or any real email provider — `@demo.splitfin` is not a resolvable
 * domain. A real user created via OAuth or email/password gets the exact
 * same `User` row shape with `isDemo: false` and never appears in this file.
 *
 * Passwords are deterministic plaintext here because this file's only
 * consumer is the DemoAuthProvider (integration/auth-contract.ts), which is
 * expected to compare against a fixture list, not a hashed production
 * credentials table. Do not reuse this pattern for real user auth.
 */

import type { DemoCredential } from "../lib/domain";
import { DEMO_ACCOUNT } from "@/src/config/demo-credentials";

export interface DemoIdentityBlueprint {
  userId: string;
  email: string;
  password: string;
}

export const demoIdentities: DemoIdentityBlueprint[] = [
  { userId: DEMO_ACCOUNT.userId, email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password },
];

export const demoCredentials: DemoCredential[] = demoIdentities.map((d) => ({
  email: d.email,
  password: d.password,
  userId: d.userId,
}));

export function findDemoCredential(email: string): DemoCredential | undefined {
  return demoCredentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
}