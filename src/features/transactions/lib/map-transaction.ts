/**
 * features/transactions/lib/map-transaction.ts
 *
 * SINGLE canonical mapper from an API transaction row to the frontend
 * `Transaction` view model.
 *
 * Phase 1.3, Part 9 ("every transaction should exist in exactly one
 * canonical form") found this same mapping duplicated three times
 * (use-day-transactions.ts, use-month-aggregation.ts,
 * use-financial-view.ts) — and each copy computed `isoDate` differently
 * from how the calendar grid keys its days:
 *
 *   - the three duplicated mappers used `date.toISOString().slice(0, 10)`,
 *     which is the UTC calendar date;
 *   - `calendar-utils.ts#toDateKey` (used to build the month grid and to
 *     drive navigation to `/transactions/day/[date]`) uses
 *     `getFullYear()/getMonth()/getDate()`, i.e. the *local* calendar date.
 *
 * For any user not in UTC (this app's users are IST, UTC+5:30), a
 * transaction timestamped in the early hours of local-morning falls on
 * the *previous* UTC day. That transaction would then be bucketed under
 * the wrong day in `aggregateTransactionsByDate`, contributing to one
 * calendar cell's total while the day-detail page (which links to the
 * *local* date key) looked it up under a different key and found
 * nothing — a second, independent contributor to the "calendar day
 * shows income, opening it shows 0 transactions" bug (the primary cause
 * was the date-range bug fixed in transaction-service.ts).
 *
 * Fix: derive `isoDate` from local calendar-date components, matching
 * `toDateKey` exactly, and do it in exactly one place.
 */
import type { Transaction } from "@/src/types/transaction";

export type TransactionRow = {
  id: string;
  payee: string;
  amount: number;
  date: string | Date;
  account: string;
  category: string | null;
  notes: string | null;
};

/** Local calendar-date key (`yyyy-MM-dd`) — must match calendar-utils#toDateKey. */
function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function mapTransactionRow(row: TransactionRow): Transaction {
  const date = new Date(row.date);
  return {
    id: row.id,
    merchant: row.payee,
    subtitle: row.notes ?? "",
    category: row.category ?? "Uncategorized",
    icon: "receipt",
    account: row.account,
    type: row.amount >= 0 ? "income" : "expense",
    amount: Math.abs(row.amount),
    currency: "INR",
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: date.toLocaleDateString(),
    isoDate: toLocalDateKey(date),
    status: "completed",
  };
}
