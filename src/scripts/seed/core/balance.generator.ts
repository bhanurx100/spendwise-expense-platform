/**
 * scripts/seed/core/balance.generator.ts
 *
 * The balance engine, and the ONLY place account balances are computed
 * anywhere in the seed system:
 *
 *     Opening Balance
 *       ↓
 *     every COMPLETED transaction updates a running balance, in date order
 *       ↓
 *     Ending / Closing Balance
 *       ↓
 *     Stored Account Balance (accounts.current_balance)
 *
 * `status: "failed"` transactions are inserted into the database (so the
 * Transactions screen can still show a declined payment) but are excluded
 * here — a declined charge never actually moved money, so it must never
 * touch the balance.
 *
 * Sign convention: every Transaction carries an unsigned `amountMilli`
 * plus an explicit `direction`. The signed delta this engine applies to an
 * account's running balance is `direction === "credit" ? +amountMilli :
 * -amountMilli` — the exact same rule `run-seed.ts` uses when writing the
 * signed `amount` column, so the balance this engine computes and the sum
 * of the rows actually inserted can never drift apart.
 *
 * `assetAccountTypes` never runs negative in this dataset by design — a
 * demo user's bank/wallet/cash accounts don't have overdraft. A credit
 * card is the one account type allowed a negative balance (it's a
 * liability: negative = amount owed), and the UI already converts that
 * sign for display (see accounts-headline.tsx / account-manager-modal.tsx
 * — `Math.abs(balance)` for a credit card's shown value). If a
 * non-credit-card account would ever go negative, that's a blueprint bug,
 * not a display detail — analytics.generator.ts hard-fails the whole seed
 * run rather than let it happen.
 */

import type { Account } from "../lib/domain";
import type { Transaction } from "../lib/domain";

export function signedDelta(t: Pick<Transaction, "amountMilli" | "direction">): number {
  return t.direction === "credit" ? t.amountMilli : -t.amountMilli;
}

export interface BalancePoint {
  transactionId: string;
  date: Date;
  delta: number;
  runningBalanceMilli: number;
}

export interface AccountBalanceResult {
  accountId: string;
  openingBalanceMilli: number;
  closingBalanceMilli: number;
  isLiability: boolean;
  /** Every completed transaction on this account, in applied order, with
   *  the running balance immediately after it — used both to compute the
   *  final balance and, in analytics.generator.ts, to catch a negative
   *  dip anywhere mid-history, not just at the end. */
  series: BalancePoint[];
}

export function computeAccountBalances(accounts: Account[], transactions: Transaction[]): Map<string, AccountBalanceResult> {
  const byAccount = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.status !== "completed") continue; // failed/pending never move money
    const list = byAccount.get(t.accountId) ?? [];
    list.push(t);
    byAccount.set(t.accountId, list);
  }

  const results = new Map<string, AccountBalanceResult>();
  for (const account of accounts) {
    const list = (byAccount.get(account.id) ?? []).slice().sort((a, b) => {
      const byDate = a.date.getTime() - b.date.getTime();
      if (byDate !== 0) return byDate;
      return a.id.localeCompare(b.id); // stable, deterministic tiebreaker
    });

    let running = account.openingBalanceMilli;
    const series: BalancePoint[] = [];
    for (const t of list) {
      const delta = signedDelta(t);
      running += delta;
      series.push({ transactionId: t.id, date: t.date, delta, runningBalanceMilli: running });
    }

    results.set(account.id, {
      accountId: account.id,
      openingBalanceMilli: account.openingBalanceMilli,
      closingBalanceMilli: running,
      isLiability: account.type === "credit-card",
      series,
    });
  }
  return results;
}