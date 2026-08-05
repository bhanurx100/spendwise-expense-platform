/**
 * scripts/seed/core/calendar.generator.ts
 *
 * Pure aggregation, no persistence — the Calendar screen already computes
 * day totals live from the `transactions` table (same as every other
 * screen), so this module isn't a generator of database rows. Its job is
 * to compute the *same* day/month totals independently, in
 * analytics.generator.ts's validation pass, so we can assert
 * `sum(day totals) === month total` and `sum(month totals) === dataset
 * total` actually hold for the data we're about to seed — catching a
 * reconciliation bug before a single row is written, not after.
 */

import { isoDate } from "../lib/kernel";
import { isoMonthKey } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export interface DayTotal {
  day: string; // YYYY-MM-DD
  incomeMilli: number;
  expenseMilli: number;
  netMilli: number;
  count: number;
}

export interface MonthTotal {
  month: string; // YYYY-MM
  incomeMilli: number;
  expenseMilli: number;
  netMilli: number;
  count: number;
}

/** Whether this transaction counts as "income" or "expense" for cash-flow
 *  purposes. Every type in the vocabulary maps to exactly one of these
 *  two buckets by direction — a credit is money in, a debit is money out
 *  — which is what keeps Cash Flow, Calendar, and Categories all reading
 *  off the same definition instead of three subtly different ones. */
function bucket(t: Transaction): "income" | "expense" {
  return t.direction === "credit" ? "income" : "expense";
}

export function buildDayTotals(transactions: Transaction[]): Map<string, DayTotal> {
  const byDay = new Map<string, DayTotal>();
  for (const t of transactions) {
    if (t.status !== "completed") continue;
    const key = isoDate(t.date);
    const existing = byDay.get(key) ?? { day: key, incomeMilli: 0, expenseMilli: 0, netMilli: 0, count: 0 };
    if (bucket(t) === "income") existing.incomeMilli += t.amountMilli;
    else existing.expenseMilli += t.amountMilli;
    existing.netMilli = existing.incomeMilli - existing.expenseMilli;
    existing.count += 1;
    byDay.set(key, existing);
  }
  return byDay;
}

export function buildMonthTotals(dayTotals: Map<string, DayTotal>): Map<string, MonthTotal> {
  const byMonth = new Map<string, MonthTotal>();
  for (const day of Array.from(dayTotals.values())) {
    const key = day.day.slice(0, 7);
    const existing = byMonth.get(key) ?? { month: key, incomeMilli: 0, expenseMilli: 0, netMilli: 0, count: 0 };
    existing.incomeMilli += day.incomeMilli;
    existing.expenseMilli += day.expenseMilli;
    existing.netMilli += day.netMilli;
    existing.count += day.count;
    byMonth.set(key, existing);
  }
  return byMonth;
}

export function buildCategoryTotals(transactions: Transaction[]): Map<string, { incomeMilli: number; expenseMilli: number; count: number }> {
  const byCategory = new Map<string, { incomeMilli: number; expenseMilli: number; count: number }>();
  for (const t of transactions) {
    if (t.status !== "completed") continue;
    const existing = byCategory.get(t.categoryId) ?? { incomeMilli: 0, expenseMilli: 0, count: 0 };
    if (bucket(t) === "income") existing.incomeMilli += t.amountMilli;
    else existing.expenseMilli += t.amountMilli;
    existing.count += 1;
    byCategory.set(t.categoryId, existing);
  }
  return byCategory;
}

export { isoMonthKey };