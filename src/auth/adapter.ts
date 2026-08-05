import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/src/db/drizzle";
import {
  users,
  authAccounts,
  sessions,
  verificationTokens,
} from "@/src/db/schema";

/**
 * src/auth/adapter.ts
 *
 * Official Auth.js Drizzle adapter, pointed at the renamed `authAccounts`
 * table (see db/schema.ts header comment for why it's renamed from the
 * adapter's default "accounts").
 */
export const drizzleAdapter = DrizzleAdapter(db, {
  usersTable: users as any,
  accountsTable: authAccounts as any,
  sessionsTable: sessions as any,
  verificationTokensTable: verificationTokens as any,
});
