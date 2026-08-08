/**
 * features/summary/api/summary-api.ts
 *
 * Pure API communication for the summary endpoint.
 * NO React, NO hooks, NO business logic.
 *
 * The summary route returns pre-aggregated data from the server.
 * Unit conversion (milliunits → decimals) happens here so the hook
 * and components never see raw milliunits.
 */

import { client } from "@/src/lib/hono";
import { convertAmountFromMilliunits } from "@/src/lib/utils";
import type { SummaryFilters } from "./query-keys";

// ─── Response shape (mirrors server route output) ──────────────────────────────

export type SummaryDay = {
  date: string;
  income: number;
  expenses: number;
  transactionCount: number;
};

export type SummaryCategory = {
  name: string;
  value: number;
};

export type SummaryData = {
  remainingAmount: number;
  remainingChange: number;
  incomeAmount: number;
  incomeChange: number;
  expensesAmount: number;
  expensesChange: number;
  categories: SummaryCategory[];
  days: SummaryDay[];
};

// ─── API function ──────────────────────────────────────────────────────────────

/**
 * Fetch the financial summary for the given date range + account filter.
 * Converts all amount values from milliunits to plain decimals before returning.
 */
export async function getSummary(
  filters: SummaryFilters = {}
): Promise<SummaryData> {
  const response = await client.api.summary.$get({
    query: {
      from:      filters.from      ?? "",
      to:        filters.to        ?? "",
      accountId: filters.accountId ?? "",
    },
  });

  if (!response.ok) {
    console.error("[SUMMARY] fetch failed status=", response.status);
    throw new Error(`Failed to fetch summary (${response.status}).`);
  }

  const { data } = await response.json();
  if (!data) {
    console.error("[SUMMARY] response missing data payload");
    throw new Error("Failed to fetch summary.");
  }

  return {
    remainingAmount: convertAmountFromMilliunits(data.remainingAmount),
    remainingChange: data.remainingChange,
    incomeAmount:    convertAmountFromMilliunits(data.incomeAmount),
    incomeChange:    data.incomeChange,
    expensesAmount:  convertAmountFromMilliunits(data.expensesAmount),
    expensesChange:  data.expensesChange,
    categories: data.categories.map((c) => ({
      ...c,
      value: convertAmountFromMilliunits(c.value),
    })),
    days: data.days.map((d) => ({
      ...d,
      income:   convertAmountFromMilliunits(d.income),
      expenses: convertAmountFromMilliunits(d.expenses),
    })),
  };
}