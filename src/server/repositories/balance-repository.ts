/**
 * server/repositories/balance-repository.ts
 *
 * SINGLE SOURCE OF TRUTH for "current account balance."
 *
 * balance = accounts.openingBalance + SUM(transactions.amount for that account)
 * — computed over ALL transactions ever recorded for the account, never a
 * date-limited window. This is intentionally a live aggregate rather than a
 * maintained `currentBalance` column: it can never drift out of sync with
 * the transactions table, at the cost of one aggregation query per read.
 * If this becomes a hot path at scale, a maintained running-total column
 * updated transactionally on every write is the natural next step — but
 * that introduces a second value that can desync, so it's deferred until
 * profiling shows the aggregate query is actually a bottleneck.
 *
 * Every screen that needs a balance (Accounts, Dashboard, Transactions, and
 * future Portfolio/Analytics) must go through this module — never re-derive
 * balance from a paginated or date-filtered transaction list on the client.
 */

import { eq, sql } from "drizzle-orm";

import { db } from "@/src/db/drizzle";
import { accounts, transactions } from "@/src/db/schema";

export type AccountBalanceRow = {
  accountId: string;
  balance: number;
};

/**
 * All account balances for a user in a single query (no N+1).
 * Returns a Map for O(1) lookup by accountId.
 */
export async function getAccountBalances(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({
      accountId: accounts.id,
      openingBalance: accounts.openingBalance,
      txTotal: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(accounts)
    .leftJoin(transactions, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.userId, userId))
    .groupBy(accounts.id, accounts.openingBalance);

  return new Map(
    rows.map((row) => [row.accountId, row.openingBalance + Number(row.txTotal)])
  );
}

/**
 * Balance for a single account, scoped to userId so it doubles as an
 * ownership check (returns null if the account doesn't exist or isn't
 * owned by this user).
 */
export async function getAccountBalance(
  accountId: string,
  userId: string
): Promise<number | null> {
  const [row] = await db
    .select({
      openingBalance: accounts.openingBalance,
      txTotal: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(accounts)
    .leftJoin(transactions, eq(transactions.accountId, accounts.id))
    .where(sql`${accounts.id} = ${accountId} AND ${accounts.userId} = ${userId}`)
    .groupBy(accounts.id, accounts.openingBalance);

  if (!row) return null;
  return row.openingBalance + Number(row.txTotal);
}
