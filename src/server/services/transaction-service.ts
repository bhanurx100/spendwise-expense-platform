/**
 * server/services/transaction-service.ts
 *
 * Orchestration layer between route handlers and the repository.
 * - Accepts already-verified userId from the route handler.
 * - Owns date-defaulting logic (kept out of both route and repository).
 * - Returns plain objects; routes are responsible for ctx.json().
 */

import { parse, subDays, endOfDay } from "date-fns";
import { DEFAULT_LOOKBACK_DAYS } from "@/src/lib/date-ranges";

import {
  listTransactions,
  getTransactionById,
  insertTransaction,
  insertManyTransactions,
  updateTransaction,
  deleteTransaction,
  deleteManyTransactions,
} from "@/src/server/repositories/transaction-repository";

import type { z } from "zod";
import type { insertTransactionSchema } from "@/src/db/schema";

type InsertPayload = z.infer<typeof insertTransactionSchema>;

// ── Date helpers ──────────────────────────────────────────────────────────────

const DATE_FMT = "yyyy-MM-dd";

// Previously defaulted an absent `from` to the last 30 days, which silently
// truncated every page that doesn't wire an explicit period selector
// (Transactions, Dashboard, Accounts all called this with no range at
// all) — "All Time" further up the stack could never actually show more
// than 30 days because it relied on omitting `from`, and omission hit
// this same default. Bumped to a 1-year floor (see lib/date-ranges.ts);
// callers that need the true full history send an explicit `from` via
// rangeForPeriod('All'), which never goes through this fallback.
function resolveDateRange(from?: string, to?: string) {
  // `to` is parsed as yyyy-MM-dd, which date-fns anchors to 00:00:00 of
  // that day. Used as-is against `lte(transactions.date, endDate)`, this
  // excludes every transaction recorded after midnight — i.e. effectively
  // the entire day. For an explicit `to`, that day must always be fully
  // included, so the upper bound is normalized to the last instant of
  // that day (23:59:59.999). The "no explicit `to`" case already means
  // "up to right now" and needs no adjustment.
  const parsedTo = to ? parse(to, DATE_FMT, new Date()) : new Date();
  const endDate   = to ? endOfDay(parsedTo) : parsedTo;
  const startDate = from ? parse(from, DATE_FMT, new Date()) : subDays(endDate, DEFAULT_LOOKBACK_DAYS);
  return { startDate, endDate };
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getTransactions(
  userId: string,
  filters: { from?: string; to?: string; accountId?: string }
) {
  const { startDate, endDate } = resolveDateRange(filters.from, filters.to);

  return listTransactions({
    userId,
    accountId: filters.accountId,
    startDate,
    endDate,
  });
}

export async function getTransaction(id: string, userId: string) {
  return getTransactionById(id, userId);
}

// ── Write ─────────────────────────────────────────────────────────────────────
//
// SECURITY: both functions require userId and verify (in the repository)
// that every accountId referenced actually belongs to that user before any
// row is inserted. This closes the IDOR gap where a client could previously
// create a transaction against an arbitrary accountId. See
// AccountOwnershipError in transaction-repository.ts.

export async function createTransaction(
  userId: string,
  values: Omit<InsertPayload, "id">
) {
  return insertTransaction(userId, values);
}

export async function createManyTransactions(
  userId: string,
  rows: Omit<InsertPayload, "id">[]
) {
  return insertManyTransactions(userId, rows);
}

export async function editTransaction(
  id: string,
  userId: string,
  values: Omit<InsertPayload, "id">
) {
  return updateTransaction(id, userId, values);
}

export async function removeTransaction(id: string, userId: string) {
  return deleteTransaction(id, userId);
}

export async function removeManyTransactions(ids: string[], userId: string) {
  return deleteManyTransactions(ids, userId);
}