/**
 * scripts/seed/finance/salary.generator.ts
 *
 * Single responsibility: `incomeEvents` (Salary, occasional Freelance
 * Income) → real credited transactions, with `salaryIncrements` applied
 * once an event crosses its `afterMonthIndex` — a 15-month history
 * shouldn't pay the exact same salary in month 1 as month 15.
 */

import { atTime, randAmount, randInt } from "../lib/kernel";
import { buildTx, monthIndexSince, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateSalaryAndFreelanceIncome(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const event of ctx.user.incomeEvents) {
    for (const day of Array.from(monthlyOccurrences(from, to, event.dayOfMonth))) {
      if (event.monthsActive && !event.monthsActive.includes(day.getMonth())) continue;

      const monthIdx = monthIndexSince(from, day);
      let [lo, hi] = event.amountRangeMilli;
      for (const inc of ctx.user.salaryIncrements) {
        if (inc.incomeLabel === event.label && monthIdx >= inc.afterMonthIndex) {
          const factor = 1 + inc.incrementPercent / 100;
          lo *= factor;
          hi *= factor;
        }
      }

      const amount = randAmount(ctx.rng, Math.round(lo), Math.round(hi), 1000);
      out.push(
        buildTx(ctx, {
          tag: "income",
          date: atTime(day, 9, randInt(ctx.rng, 0, 40)),
          merchantId: event.merchantId,
          accountSlug: event.accountSlug,
          amountMilli: amount,
          direction: "credit",
          type: "income",
          notes: event.label,
        }),
      );
    }
  }
  return out;
}