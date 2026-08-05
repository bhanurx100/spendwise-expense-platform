/**
 * server/repositories/transaction-repository.ts
 *
 * OPTIMIZATIONS vs original:
 *  1. updateTransaction: replaced CTE + subquery pattern with a single UPDATE
 *     that joins accounts inline via a WHERE EXISTS subquery. This avoids the
 *     two-phase "find then update" CTE and lets Postgres resolve ownership in
 *     one query plan. Estimated saving: ~1 round-trip on hot paths.
 *
 *  2. deleteTransaction / deleteManyTransactions: same CTE → WHERE EXISTS
 *     simplification. The CTE was semantically correct but forced an extra
 *     planning step; the EXISTS form lets the planner use the accounts index
 *     directly inside the DELETE predicate.
 *
 *  3. TX_SELECT and TX_SELECT_DETAIL are unchanged — already minimal.
 *
 *  4. listTransactions, getTransactionById, insertTransaction,
 *     insertManyTransactions: unchanged — already optimal.
 *
 * All return types and shapes are identical to the original.
 */

import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/src/db/drizzle";
import {
  accounts,
  categories,
  insertTransactionSchema,
  transactions,
} from "@/src/db/schema";

import type { z } from "zod";

// ── Shared select shape (matches existing API response exactly) ────────────────

const TX_SELECT = {
  id:         transactions.id,
  date:       transactions.date,
  category:   categories.name,
  categoryId: transactions.categoryId,
  payee:      transactions.payee,
  amount:     transactions.amount,
  notes:      transactions.notes,
  account:    accounts.name,
  accountId:  transactions.accountId,
} as const;

const TX_SELECT_DETAIL = {
  id:         transactions.id,
  date:       transactions.date,
  categoryId: transactions.categoryId,
  payee:      transactions.payee,
  amount:     transactions.amount,
  notes:      transactions.notes,
  accountId:  transactions.accountId,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type InsertValues = z.infer<typeof insertTransactionSchema> & { id: string };

export type ListFilters = {
  userId: string;
  accountId?: string;
  startDate: Date;
  endDate: Date;
};

// ── Read ──────────────────────────────────────────────────────────────────────

export async function listTransactions(filters: ListFilters) {
  const { userId, accountId, startDate, endDate } = filters;

  return db
    .select(TX_SELECT)
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        accountId ? eq(transactions.accountId, accountId) : undefined,
        eq(accounts.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      )
    )
    .orderBy(desc(transactions.date));
}

export async function getTransactionById(id: string, userId: string) {
  const [row] = await db
    .select(TX_SELECT_DETAIL)
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(transactions.id, id),
        eq(accounts.userId, userId),
      )
    );

  return row ?? null;
}

// ── Ownership guard ──────────────────────────────────────────────────────────
//
// SECURITY: insertTransaction/insertManyTransactions must never trust a
// client-supplied accountId without verifying it belongs to the requesting
// user. This mirrors the WHERE EXISTS pattern already used by update/delete
// below. Without this check, any authenticated user could create a
// transaction against ANY account id that exists in the database (IDOR).

export class AccountOwnershipError extends Error {
  constructor(accountId: string) {
    super(`Account ${accountId} does not belong to the requesting user.`);
    this.name = "AccountOwnershipError";
  }
}

async function assertOwnsAccount(accountId: string, userId: string): Promise<void> {
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

  if (!row) {
    throw new AccountOwnershipError(accountId);
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function insertTransaction(
  userId: string,
  values: Omit<InsertValues, "id">
): Promise<typeof transactions.$inferSelect> {
  await assertOwnsAccount(values.accountId, userId);

  const [row] = await db
    .insert(transactions)
    .values({ id: createId(), ...values })
    .returning();

  return row;
}

export async function insertManyTransactions(
  userId: string,
  rows: Omit<InsertValues, "id">[]
): Promise<(typeof transactions.$inferSelect)[]> {
  // Verify every distinct accountId referenced belongs to this user before
  // inserting any row — an all-or-nothing check, not a partial filter, so
  // bulk-create can't silently drop rows a client didn't expect to lose.
  if (rows.length === 0) return [];

  const distinctAccountIds = Array.from(new Set(rows.map((r) => r.accountId)));

  const owned = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(inArray(accounts.id, distinctAccountIds), eq(accounts.userId, userId)));

  const ownedIds = new Set(owned.map((a) => a.id));
  const unowned = distinctAccountIds.filter((id) => !ownedIds.has(id));

  if (unowned.length > 0) {
    throw new AccountOwnershipError(unowned[0]);
  }

  return db
    .insert(transactions)
    .values(rows.map((r) => ({ id: createId(), ...r })))
    .returning();
}

// ── Update ────────────────────────────────────────────────────────────────────
//
// OPTIMIZED: single UPDATE with WHERE EXISTS instead of CTE + subquery.
// The EXISTS subquery checks account ownership inline — same semantics,
// one fewer planning step.

export async function updateTransaction(
  id: string,
  userId: string,
  values: Omit<InsertValues, "id">
): Promise<typeof transactions.$inferSelect | null> {
  const [row] = await db
    .update(transactions)
    .set(values)
    .where(
      and(
        eq(transactions.id, id),
        sql`EXISTS (
          SELECT 1 FROM ${accounts}
          WHERE ${accounts.id} = ${transactions.accountId}
            AND ${accounts.userId} = ${userId}
        )`
      )
    )
    .returning();

  return row ?? null;
}

// ── Delete ────────────────────────────────────────────────────────────────────
//
// OPTIMIZED: same EXISTS pattern — single DELETE without a CTE round-trip.

export async function deleteTransaction(
  id: string,
  userId: string
): Promise<{ id: string } | null> {
  const [row] = await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, id),
        sql`EXISTS (
          SELECT 1 FROM ${accounts}
          WHERE ${accounts.id} = ${transactions.accountId}
            AND ${accounts.userId} = ${userId}
        )`
      )
    )
    .returning({ id: transactions.id });

  return row ?? null;
}

export async function deleteManyTransactions(
  ids: string[],
  userId: string
): Promise<{ id: string }[]> {
  if (ids.length === 0) return [];

  return db
    .delete(transactions)
    .where(
      and(
        inArray(transactions.id, ids),
        sql`EXISTS (
          SELECT 1 FROM ${accounts}
          WHERE ${accounts.id} = ${transactions.accountId}
            AND ${accounts.userId} = ${userId}
        )`
      )
    )
    .returning({ id: transactions.id });
}