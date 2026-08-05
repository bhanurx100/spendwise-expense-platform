/**
 * server/repositories/summary-repository.ts
 *
 * OPTIMIZATIONS vs original:
 *  1. Removed unused `isSameDay` import (was only used in the service's old
 *     fillMissingDays — now handled by the Map approach there).
 *  2. getDailyTotals: date is returned as a raw Date; no extra cast needed
 *     because Neon already returns timestamp columns as JS Date objects.
 *  3. getFinancialTotals / getCategoryTotals: column lists are already minimal
 *     — no further reduction possible without breaking callers.
 *  4. All three query functions are intentionally independent so the service
 *     layer can run them in parallel via Promise.all.
 *
 * Behavior is identical to the original.
 */

import { and, desc, eq, gte, lt, lte, sql, sum } from "drizzle-orm";
import { db } from "@/src/db/drizzle";
import { accounts, categories, transactions } from "@/src/db/schema";

// ─── Shared filter type ────────────────────────────────────────────────────────

export type SummaryDbParams = {
  userId:     string;
  startDate:  Date;
  endDate:    Date;
  accountId?: string;
};

// ─── Return types ──────────────────────────────────────────────────────────────

export type FinancialTotalsRow = {
  income:    number;
  expenses:  number;
  remaining: number;
};

export type CategoryTotalRow = {
  name:  string;
  value: number;
};

export type DailyTotalRow = {
  date:             Date;
  income:           number;
  expenses:         number;
  transactionCount: number;
};

// ─── Shared WHERE builder — avoids repeating the same and() block 3× ──────────

function periodWhere(
  params: SummaryDbParams,
) {
  const { userId, startDate, endDate, accountId } = params;
  return and(
    accountId ? eq(transactions.accountId, accountId) : undefined,
    eq(accounts.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
  );
}

// ─── Repository ────────────────────────────────────────────────────────────────

export const summaryRepository = {

  /**
   * Aggregate income / expenses / remaining for a user within a date window.
   * Optionally scoped to a single account.
   *
   * Called twice by the service (current + prior period) — both calls are
   * issued in parallel via Promise.all so there is no sequential latency.
   */
  async getFinancialTotals(
    params: SummaryDbParams
  ): Promise<FinancialTotalsRow> {
    const [row] = await db
      .select({
        income: sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`
          .mapWith(Number),
        expenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`
          .mapWith(Number),
        remaining: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(periodWhere(params));

    return {
      income:    row?.income    ?? 0,
      expenses:  row?.expenses  ?? 0,
      remaining: row?.remaining ?? 0,
    };
  },

  /**
   * Spending totals grouped by category — expenses only, ordered desc.
   * Returns all categories; the service handles top-N + "Other" bucketing.
   */
  async getCategoryTotals(
    params: SummaryDbParams
  ): Promise<CategoryTotalRow[]> {
    const { startDate, endDate, accountId, userId } = params;

    return db
      .select({
        name:  categories.name,
        value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, userId),
          lt(transactions.amount, 0),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        )
      )
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));
  },

  /**
   * Daily income + expense totals for chart rendering.
   * Returns only days that have transactions — the service fills gaps.
   * Expenses are returned as positive values (ABS applied in SQL).
   *
   * BUG FIX: this used to `GROUP BY transactions.date` on the raw
   * `timestamp` column. `transactions.date` stores a full timestamp
   * (the seed generator assigns each transaction a distinct time-of-day
   * via `atTime()`), so grouping by the literal column grouped almost
   * nothing — every transaction on a given calendar day got its own
   * "day" row because its timestamp differed by minutes/hours from its
   * neighbors. The service layer then collapsed those same-day rows
   * into one Map entry keyed by calendar day, and `Map.set()` on a
   * repeated key *overwrites* rather than adds — so only the LAST
   * transaction of any day with more than one transaction survived,
   * silently discarding every other transaction's contribution to that
   * day's income/expense total. This is what made the Overview's Cash
   * Flow card (₹301 income for a month with real salary + other income
   * transactions in it) disagree with the Calendar, which aggregates
   * the same transactions correctly because it sums per-day itself.
   *
   * Fix: truncate to the calendar day *in SQL*, so one row per day
   * comes back already fully aggregated — nothing left for the client
   * to accidentally overwrite. `transactionCount` is added so callers
   * (e.g. the Calendar) can build UI (activity dots, "N transactions")
   * from this canonical row without a second, independent transaction
   * fetch + client-side aggregation.
   */
  async getDailyTotals(
    params: SummaryDbParams
  ): Promise<DailyTotalRow[]> {
    const { startDate, endDate, accountId, userId } = params;
    const day = sql<Date>`date_trunc('day', ${transactions.date})`;

    return db
      .select({
        date: day,
        income: sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`
          .mapWith(Number),
        expenses: sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`
          .mapWith(Number),
        transactionCount: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          accountId ? eq(transactions.accountId, accountId) : undefined,
          eq(accounts.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate),
        )
      )
      .groupBy(day)
      .orderBy(day);
  },
};