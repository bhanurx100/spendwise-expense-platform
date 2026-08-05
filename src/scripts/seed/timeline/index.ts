/**
 * scripts/seed/timeline/index.ts
 *
 * The single orchestrator that walks the 15-month window and composes
 * every finance/*.generator.ts output into one final, sorted transaction
 * list. This replaces the old one-file "story engine"
 * (finance/transactions.seed.ts) — each generator below now has exactly
 * one responsibility, and this file's only job is calling them in the
 * right order and merging the result.
 *
 * Order matters for exactly one reason: `generateCardPayments` needs to
 * know what was actually charged to the credit card, so it must run
 * *after* every generator that can put a transaction on that account
 * (habits, occasional events, recurring bills, subscriptions, life
 * events). Every other generator is independent of the others.
 *
 * Determinism: every generator shares ONE seeded RNG instance
 * (`lib/kernel.createRng`), scoped once per demo-user run, so re-seeding
 * reproduces byte-identical history. IDs are assigned by a single shared
 * sequence counter (`EngineContext.seq`) in the exact order generators run
 * here — reordering the calls below changes every generated id, which is
 * why generator call order is fixed, not "whichever runs first wins."
 */

import { createRng } from "../lib/kernel";
import { DEMO_USER_SLUG } from "../lib/constants";
import type { EngineContext } from "../lib/engine";
import type { DemoUserBlueprint } from "../demo-user/demo-user.types";
import type { Transaction } from "../lib/domain";

import { generateSalaryAndFreelanceIncome } from "../finance/salary.generator";
import { generateInterestCredits } from "../finance/interest.generator";
import { generateRecurringExpenses, generateBills, generateSpendingHabits, generateOccasionalEvents } from "../finance/expense.generator";
import { generateSubscriptionCharges, generateFailedSubscriptionPayments } from "../finance/subscription.generator";
import { generateCashback } from "../finance/cashback.generator";
import { generateRefunds } from "../finance/refund.generator";
import { generateInvestmentContributions } from "../finance/investment.generator";
import { generateInternalTransfers, generateCardPayments } from "../finance/transfer.generator";
import { generateAtmWithdrawals } from "../finance/atm.generator";
import { generateLifeEvents } from "../finance/life-events.generator";

export interface TimelineResult {
  transactions: Transaction[];
  rangeStart: Date;
  rangeEnd: Date;
}

export function buildTimeline(user: DemoUserBlueprint, userId: string, rangeEnd: Date): TimelineResult {
  const rangeStart = new Date(rangeEnd);
  rangeStart.setMonth(rangeStart.getMonth() - user.historyMonths);

  const ctx: EngineContext = { user, userId, rng: createRng(`${DEMO_USER_SLUG}:timeline`), seq: { n: 0 } };

  // Pass 1 — every generator that doesn't depend on anything else.
  const passOne: Transaction[] = [
    ...generateSalaryAndFreelanceIncome(ctx, rangeStart, rangeEnd),
    ...generateInterestCredits(ctx, rangeStart, rangeEnd),
    ...generateRecurringExpenses(ctx, rangeStart, rangeEnd),
    ...generateBills(ctx, rangeStart, rangeEnd),
    ...generateSpendingHabits(ctx, rangeStart, rangeEnd),
    ...generateOccasionalEvents(ctx, rangeStart, rangeEnd),
    ...generateSubscriptionCharges(ctx, rangeStart, rangeEnd),
    ...generateFailedSubscriptionPayments(ctx, rangeStart, rangeEnd),
    ...generateCashback(ctx, rangeStart, rangeEnd),
    ...generateRefunds(ctx, rangeStart, rangeEnd),
    ...generateInvestmentContributions(ctx, rangeStart, rangeEnd),
    ...generateInternalTransfers(ctx, rangeStart, rangeEnd),
    ...generateAtmWithdrawals(ctx, rangeStart, rangeEnd),
    ...generateLifeEvents(ctx, rangeStart, rangeEnd),
  ];

  // Pass 2 — depends on pass 1's credit-card spend.
  const cardPayments = generateCardPayments(ctx, rangeStart, rangeEnd, passOne);

  const transactions = [...passOne, ...cardPayments].sort((a, b) => a.date.getTime() - b.date.getTime());

  return { transactions, rangeStart, rangeEnd };
}