/**
 * lib/date-ranges.ts
 *
 * Single source of truth for "what does an unfiltered / All Time date
 * range mean" across the app. Before this file existed, the server
 * defaulted an absent `from` to `subDays(now, 30)` in two different
 * places (transaction-service, summary-service), and the client's "All
 * Time" period option sent `{}` (no `from` at all) assuming that meant
 * "unlimited" — but omitting `from` actually hit the server's 30-day
 * default. The net effect: "All Time" silently showed only the last 30
 * days, and every page that didn't wire an explicit period selector
 * (Transactions, Dashboard, Accounts) was permanently capped at 30 days
 * of history with no way to see older data.
 *
 * Fix: no more implicit "recent window" defaults. Absence of `from` means
 * the full history, bounded only by this sentinel start date. Bounded
 * windows (7D/30D/3M/6M/1Y) always pass an explicit `from` computed from
 * "now", and "All Time" passes this same sentinel explicitly instead of
 * relying on omission.
 */

import { format, subDays, subMonths, subYears } from "date-fns";

/** No demo or real account predates this. Acts as the "no lower bound"
 *  start date for an explicit "All Time" request. */
export const BEGINNING_OF_TIME = new Date("2000-01-01T00:00:00.000Z");

/**
 * When a caller doesn't specify a date range at all (no period selector
 * wired on that page yet), fall back to this — not 30 days. This is the
 * floor the task requires ("support min 1y"); pages that want the true
 * full history should send an explicit `rangeForPeriod('All')`.
 */
export const DEFAULT_LOOKBACK_DAYS = 365;

export const DATE_FMT = "yyyy-MM-dd";

export type PeriodOption = "7D" | "30D" | "3M" | "6M" | "1Y" | "All";

export const PERIOD_OPTIONS: { id: PeriodOption; label: string }[] = [
  { id: "7D", label: "7 Days" },
  { id: "30D", label: "30 Days" },
  { id: "3M", label: "3 Months" },
  { id: "6M", label: "6 Months" },
  { id: "1Y", label: "1 Year" },
  { id: "All", label: "All Time" },
];

/**
 * Turns a period label into the `{ from, to }` shape the API accepts.
 * 'All' explicitly sends the sentinel start date rather than omitting
 * `from` — so "All Time" is guaranteed to mean the full history no
 * matter what the server's own unfiltered default happens to be.
 */
export function rangeForPeriod(period: PeriodOption, now: Date = new Date()): { from: string; to: string } {
  const to = format(now, DATE_FMT);
  switch (period) {
    case "7D":
      return { from: format(subDays(now, 7), DATE_FMT), to };
    case "30D":
      return { from: format(subDays(now, 30), DATE_FMT), to };
    case "3M":
      return { from: format(subMonths(now, 3), DATE_FMT), to };
    case "6M":
      return { from: format(subMonths(now, 6), DATE_FMT), to };
    case "1Y":
      return { from: format(subYears(now, 1), DATE_FMT), to };
    case "All":
      return { from: format(BEGINNING_OF_TIME, DATE_FMT), to };
  }
}
