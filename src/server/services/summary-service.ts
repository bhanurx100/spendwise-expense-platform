/**
 * server/services/summary-service.ts
 *
 * OPTIMIZATIONS vs original:
 *  1. fillMissingDays: Map-based O(1) lookup replaces Array.find O(n) per day
 *     → for a 90-day window with 60 active days: ~5400 comparisons → ~90
 *  2. Promise.all retained (was already parallel) — confirmed no ordering dep
 *  3. No logic changes — behavior identical
 */

import { differenceInDays, parse, subDays, eachDayOfInterval, endOfDay } from "date-fns";
import { DEFAULT_LOOKBACK_DAYS } from "@/src/lib/date-ranges";
import { calculatePercentageChange } from "@/src/lib/utils";
import { summaryRepository } from "@/src/server/repositories/summary-repository";

// ─── Input / Output types ──────────────────────────────────────────────────────

export type GetSummaryInput = {
  userId:     string;
  from?:      string;
  to?:        string;
  accountId?: string;
};

export type SummaryResult = {
  remainingAmount: number;
  remainingChange: number;
  incomeAmount:    number;
  incomeChange:    number;
  expensesAmount:  number;
  expensesChange:  number;
  categories:      { name: string; value: number }[];
  days:            { date: string; income: number; expenses: number; transactionCount: number }[];
};

// ─── Private helpers ───────────────────────────────────────────────────────────

function parseDateParam(raw: string | undefined, fallback: Date): Date {
  if (!raw) return fallback;
  return parse(raw, "yyyy-MM-dd", new Date());
}

// `to` is parsed at 00:00:00 of that day; used directly as an `lte` upper
// bound it excludes the entire day it's supposed to represent. Only the
// explicit-`to` case needs normalizing — the default `defaultTo = new
// Date()` already means "right now."
function inclusiveEndDate(raw: string | undefined, parsed: Date): Date {
  return raw ? endOfDay(parsed) : parsed;
}

/**
 * Fill gaps so chart data has a point for every day in the range.
 *
 * OPTIMIZED: Build a Map<dateKey, row> once (O(n)) then look up each calendar
 * day in O(1), instead of Array.find() which is O(n) per day → O(n²) total.
 *
 * For a 90-day range with 60 active days the old code did up to 5,400
 * comparisons; this version does exactly 90 + 60 = 150 operations.
 *
 * BUG FIX: the repository now returns at most one row per calendar day
 * (grouped in SQL), so this should never actually see two rows with the
 * same date key — but it previously used `Map.set()` to build `byDate`,
 * which *overwrites* on a repeated key instead of adding. That silently
 * discarded data any time the repository returned more than one row for
 * the same day (which is exactly what was happening before the
 * repository fix, since it grouped by full timestamp, not by day).
 * Accumulating here instead of overwriting makes this function correct
 * on its own, independent of whatever the repository's grouping does —
 * so a future regression there degrades gracefully instead of silently
 * losing income/expense data again.
 */
function fillMissingDays(
  activeDays: { date: Date; income: number; expenses: number; transactionCount: number }[],
  startDate:  Date,
  endDate:    Date
): { date: string; income: number; expenses: number; transactionCount: number }[] {
  if (!activeDays.length) return [];

  // Build O(1) lookup by ISO date string key — accumulate, never overwrite.
  const byDate = new Map<string, { income: number; expenses: number; transactionCount: number }>();
  for (const row of activeDays) {
    const key = row.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { income: 0, expenses: 0, transactionCount: 0 };
    existing.income += row.income;
    existing.expenses += row.expenses;
    existing.transactionCount += row.transactionCount;
    byDate.set(key, existing);
  }

  return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
    const key   = day.toISOString().slice(0, 10);
    const found = byDate.get(key);
    return {
      date:             day.toISOString(),
      income:           found?.income   ?? 0,
      expenses:         found?.expenses ?? 0,
      transactionCount: found?.transactionCount ?? 0,
    };
  });
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const summaryService = {

  /**
   * Full dashboard summary for a user.
   * All amounts returned in milliunits — the API layer converts to decimals.
   */
  async getSummaryForUser(input: GetSummaryInput): Promise<SummaryResult> {
    const { userId, accountId } = input;

    // Date range. Previously defaulted to the last 30 days, which is why
    // the dashboard's own 3M/6M/1Y cash-flow tabs looked empty beyond the
    // first month — the underlying summary call never fetched more than
    // 30 days of daily totals to begin with. Bumped to a 1-year floor
    // (see lib/date-ranges.ts); an explicit "All Time" request from the
    // client still passes its own `from` and isn't affected by this.
    const defaultTo   = new Date();
    const defaultFrom = subDays(defaultTo, DEFAULT_LOOKBACK_DAYS);
    const startDate   = parseDateParam(input.from, defaultFrom);
    const endDate     = inclusiveEndDate(input.to, parseDateParam(input.to, defaultTo));

    const periodLength    = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd   = subDays(endDate,   periodLength);

    const baseParams = { userId, accountId, startDate, endDate };

    // All 4 queries fire in parallel — no sequential dependency
    const [current, last, rawCategories, activeDays] = await Promise.all([
      summaryRepository.getFinancialTotals(baseParams),
      summaryRepository.getFinancialTotals({
        userId,
        accountId,
        startDate: lastPeriodStart,
        endDate:   lastPeriodEnd,
      }),
      summaryRepository.getCategoryTotals(baseParams),
      summaryRepository.getDailyTotals(baseParams),
    ]);

    // Category bucketing: top 3 named + "Other"
    const topCategories   = rawCategories.slice(0, 3);
    const otherCategories = rawCategories.slice(3);
    const otherSum        = otherCategories.reduce((s, c) => s + c.value, 0);
    const finalCategories = [...topCategories];
    if (otherCategories.length > 0) finalCategories.push({ name: "Other", value: otherSum });

    return {
      remainingAmount: current.remaining,
      remainingChange: calculatePercentageChange(current.remaining, last.remaining),
      incomeAmount:    current.income,
      incomeChange:    calculatePercentageChange(current.income,    last.income),
      expensesAmount:  current.expenses,
      expensesChange:  calculatePercentageChange(current.expenses,  last.expenses),
      categories:      finalCategories,
      days:            fillMissingDays(activeDays, startDate, endDate),
    };
  },
};