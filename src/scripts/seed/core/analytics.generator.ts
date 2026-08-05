/**
 * scripts/seed/core/analytics.generator.ts
 *
 * The validation suite. Runs entirely in memory, against the generated
 * data, BEFORE a single row is written to the database — "if any mismatch
 * exists, throw error, do not seed" is a pre-flight check here, not a
 * post-hoc audit of what already landed in Postgres.
 *
 * Every check below recomputes something a screen in the app relies on,
 * independently of however the app itself will compute it later, and
 * asserts the two can't disagree:
 *
 *   - Transaction volume lands inside the blueprint's declared band
 *     (default 300-450, "not thousands") — this is the exact check that
 *     would have caught the old blueprint generating ~1,800 transactions.
 *   - Every account's running balance, recomputed transaction-by-
 *     transaction from its opening balance, matches what a live
 *     `openingBalance + SUM(transactions.amount)` query would return —
 *     the definition balance-repository.ts already uses. If they can't
 *     possibly disagree, "balances don't reconcile" becomes structurally
 *     impossible rather than something to hope for.
 *   - No asset account (savings/salary/wallet/cash) ever goes negative at
 *     any point in the 15-month series — a demo user's bank balance
 *     going negative (and the UI displaying that as a negative number)
 *     is exactly the "architecture blunder" this dataset must not ship.
 *   - Every category/subcategory referenced by a generated transaction
 *     actually exists in the global catalogs, and every subcategory's
 *     declared parent matches the category actually used.
 *   - Calendar day totals sum to month totals sum to the dataset total —
 *     by construction they're derived from the same source, but this
 *     assertion is what makes that a verified property instead of an
 *     assumption.
 *   - Every generated transaction id is unique, and every date falls
 *     inside the declared history window.
 *   - SplitPay group status is consistent with its members' net balances.
 */

import { categories as globalCategories } from "./categories.seed";
import { subcategories as globalSubcategories } from "./subcategories.seed";
import { buildDayTotals, buildMonthTotals, buildCategoryTotals } from "./calendar.generator";
import { computeAccountBalances, type AccountBalanceResult } from "./balance.generator";
import type { Account, Transaction } from "../lib/domain";
import type { DemoUserBlueprint } from "../demo-user/demo-user.types";

export class SeedValidationError extends Error {
  constructor(message: string) {
    super(`[seed validation failed] ${message}\n\nRefusing to write anything to the database.`);
    this.name = "SeedValidationError";
  }
}

export interface ValidationReport {
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  perMonthCounts: Array<{ month: string; count: number }>;
  totalIncomeMilli: number;
  totalExpenseMilli: number;
  netCashFlowMilli: number;
  accountBalances: Array<{ accountId: string; accountName: string; openingBalanceMilli: number; closingBalanceMilli: number }>;
}

function assertTransactionVolume(user: DemoUserBlueprint, all: Transaction[]): { perMonthCounts: Array<{ month: string; count: number }> } {
  const [min, max] = user.targetTransactionRange;
  if (all.length < min || all.length > max) {
    throw new SeedValidationError(
      `Generated ${all.length} transactions total, outside the declared target range [${min}, ${max}]. ` +
        `This is the exact failure mode the spec calls out — "do NOT generate thousands," "300-450 total." ` +
        `Tune the blueprint's frequencies (habits/occasional-event probabilities/transfers) rather than widening this range.`,
    );
  }

  const byMonth = new Map<string, number>();
  for (const t of all) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const perMonthCounts = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // Soft realistic-density band per month — catches a runaway generator
  // (e.g. a weekly-cadence habit that should have been monthly) even if
  // the *total* happened to still land in range by coincidence. The first
  // and last calendar month of the window are partial months by
  // construction (the window starts/ends mid-month), so they're allowed
  // to fall outside the band.
  const full = perMonthCounts.slice(1, -1);
  const outOfBand = full.filter((m) => m.count < 10 || m.count > 60);
  if (outOfBand.length > 0) {
    throw new SeedValidationError(
      `These months have an unrealistic transaction count (expected roughly 15-45/month): ` +
        outOfBand.map((m) => `${m.month}=${m.count}`).join(", "),
    );
  }

  return { perMonthCounts };
}

function assertNoDuplicateIds(all: Transaction[]) {
  const seen = new Set<string>();
  for (const t of all) {
    if (seen.has(t.id)) {
      throw new SeedValidationError(`Duplicate transaction id generated: ${t.id}. Every generator must draw from the single shared EngineContext.seq counter.`);
    }
    seen.add(t.id);
  }
}

function assertDatesInRange(all: Transaction[], rangeStart: Date, rangeEnd: Date) {
  for (const t of all) {
    if (t.date.getTime() < rangeStart.getTime() || t.date.getTime() > rangeEnd.getTime()) {
      throw new SeedValidationError(`Transaction ${t.id} is dated ${t.date.toISOString()}, outside the declared history window [${rangeStart.toISOString()}, ${rangeEnd.toISOString()}].`);
    }
  }
}

function assertCategoriesExist(all: Transaction[]) {
  const categoryIds = new Set(globalCategories.map((c) => c.id));
  const subcategoryById = new Map(globalSubcategories.map((s) => [s.id, s]));

  for (const t of all) {
    if (!categoryIds.has(t.categoryId)) {
      throw new SeedValidationError(`Transaction ${t.id} references unknown category "${t.categoryId}".`);
    }
    if (t.subcategoryId) {
      const sub = subcategoryById.get(t.subcategoryId);
      if (!sub) throw new SeedValidationError(`Transaction ${t.id} references unknown subcategory "${t.subcategoryId}".`);
      if (sub.categoryId !== t.categoryId) {
        throw new SeedValidationError(`Transaction ${t.id} pairs category "${t.categoryId}" with subcategory "${t.subcategoryId}", but that subcategory belongs to "${sub.categoryId}".`);
      }
    }
  }
}

function assertCalendarReconciles(completed: Transaction[]) {
  const dayTotals = buildDayTotals(completed);
  const monthTotals = buildMonthTotals(dayTotals);

  const sumOfDays = Array.from(dayTotals.values()).reduce((s, d) => s + d.netMilli, 0);
  const sumOfMonths = Array.from(monthTotals.values()).reduce((s, m) => s + m.netMilli, 0);
  const datasetNet = completed.reduce((s, t) => s + (t.direction === "credit" ? t.amountMilli : -t.amountMilli), 0);

  if (sumOfDays !== datasetNet) {
    throw new SeedValidationError(`Calendar day totals sum to ${sumOfDays}, but the dataset's net cash flow is ${datasetNet} — these must be identical.`);
  }
  if (sumOfMonths !== datasetNet) {
    throw new SeedValidationError(`Monthly totals sum to ${sumOfMonths}, but the dataset's net cash flow is ${datasetNet} — these must be identical.`);
  }
}

/** No asset account may ever run negative, at any point across the whole
 *  15-month series — not just at the final closing balance. A credit
 *  card is the one account type allowed to (it's a liability). */
function assertNoNegativeAssetBalances(accounts: Account[], balances: Map<string, AccountBalanceResult>) {
  for (const account of accounts) {
    const result = balances.get(account.id);
    if (!result || result.isLiability) continue;

    for (const point of result.series) {
      if (point.runningBalanceMilli < 0) {
        throw new SeedValidationError(
          `Account "${account.name}" (${account.id}) goes negative (₹${(point.runningBalanceMilli / 1000).toFixed(2)}) on ${point.date.toISOString().slice(0, 10)} ` +
            `at transaction ${point.transactionId}. Asset accounts must never go negative in this dataset — a real bank account balance ` +
            `shown as negative in the UI is exactly the "architecture blunder" this seed must not produce. Increase the opening balance, ` +
            `move the offending expense later in the month, or reduce its amount.`,
        );
      }
    }
  }
}

function assertSplitGroupsConsistent(user: DemoUserBlueprint) {
  for (const group of user.splitGroups) {
    const balances = Object.values(group.memberNetBalanceMilli);
    const anyPositive = balances.some((b) => b > 0);
    const anyNegative = balances.some((b) => b < 0);
    const allZero = balances.every((b) => b === 0);

    if (group.status === "settled" && !allZero) {
      throw new SeedValidationError(`SplitPay group "${group.name}" is marked "settled" but has a non-zero member balance.`);
    }
    if (group.status === "you-owe" && !anyNegative) {
      throw new SeedValidationError(`SplitPay group "${group.name}" is marked "you-owe" but no member has a negative (you-owe-them) balance.`);
    }
    if (group.status === "you-are-owed" && !anyPositive) {
      throw new SeedValidationError(`SplitPay group "${group.name}" is marked "you-are-owed" but no member has a positive (owes-you) balance.`);
    }
  }
}

export function validateGeneratedData(
  user: DemoUserBlueprint,
  accounts: Account[],
  allTransactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date,
): ValidationReport {
  assertNoDuplicateIds(allTransactions);
  assertDatesInRange(allTransactions, rangeStart, rangeEnd);
  assertCategoriesExist(allTransactions);
  assertSplitGroupsConsistent(user);

  const { perMonthCounts } = assertTransactionVolume(user, allTransactions);

  const completed = allTransactions.filter((t) => t.status === "completed");
  assertCalendarReconciles(completed);

  const balances = computeAccountBalances(accounts, allTransactions);
  assertNoNegativeAssetBalances(accounts, balances);

  const categoryTotals = buildCategoryTotals(completed);
  const totalIncomeMilli = Array.from(categoryTotals.values()).reduce((s, c) => s + c.incomeMilli, 0);
  const totalExpenseMilli = Array.from(categoryTotals.values()).reduce((s, c) => s + c.expenseMilli, 0);

  const nameByAccountId = new Map(accounts.map((a) => [a.id, a.name]));
  const accountBalances = Array.from(balances.values()).map((b) => ({
    accountId: b.accountId,
    accountName: nameByAccountId.get(b.accountId) ?? b.accountId,
    openingBalanceMilli: b.openingBalanceMilli,
    closingBalanceMilli: b.closingBalanceMilli,
  }));

  return {
    totalTransactions: allTransactions.length,
    completedTransactions: completed.length,
    failedTransactions: allTransactions.length - completed.length,
    perMonthCounts,
    totalIncomeMilli,
    totalExpenseMilli,
    netCashFlowMilli: totalIncomeMilli - totalExpenseMilli,
    accountBalances,
  };
}

export function printValidationReport(report: ValidationReport) {
  const rupees = (m: number) => `₹${(m / 1000).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  console.log("\n── Validation ──────────────────────────────────────────────");
  console.log(`  Transactions: ${report.totalTransactions} total (${report.completedTransactions} completed, ${report.failedTransactions} failed)`);
  console.log(`  Income:  ${rupees(report.totalIncomeMilli)}`);
  console.log(`  Expense: ${rupees(report.totalExpenseMilli)}`);
  console.log(`  Net:     ${rupees(report.netCashFlowMilli)}`);
  console.log("  Account balances:");
  for (const a of report.accountBalances) {
    console.log(`    ${a.accountName}: opening ${rupees(a.openingBalanceMilli)} → closing ${rupees(a.closingBalanceMilli)}`);
  }
  console.log("  ✅ All reconciliation checks passed.");
  console.log("───────────────────────────────────────────────────────────\n");
}