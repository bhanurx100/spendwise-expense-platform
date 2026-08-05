/**
 * scripts/seed/finance/interest.generator.ts
 *
 * Single responsibility: a small, deterministic monthly interest credit on
 * each configured interest-bearing account. This category previously had
 * no generator at all — "Interest" was listed as a required category in
 * the spec but never actually produced a transaction.
 */

import { atTime, randAmount, randInt } from "../lib/kernel";
import { buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateInterestCredits(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const rule of ctx.user.interest) {
    for (const day of Array.from(monthlyOccurrences(from, to, rule.dayOfMonth))) {
      const amount = randAmount(ctx.rng, rule.amountRangeMilli[0], rule.amountRangeMilli[1], 100);
      out.push(
        buildTx(ctx, {
          tag: "interest",
          date: atTime(day, 23, randInt(ctx.rng, 0, 40)),
          merchantId: rule.merchantId,
          accountSlug: rule.accountSlug,
          amountMilli: amount,
          direction: "credit",
          type: "interest",
          notes: "Monthly savings interest",
        }),
      );
    }
  }
  return out;
}