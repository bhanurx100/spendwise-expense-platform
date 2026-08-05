/**
 * scripts/seed/finance/atm.generator.ts
 *
 * Single responsibility: a monthly ATM cash withdrawal cycle — a debit leg
 * on the funding account and a credit leg on the cash account, both tagged
 * `type: "atm_withdrawal"`. Kept out of transfer.generator.ts because the
 * product spec calls this out as its own distinct transaction type, not a
 * generic internal transfer.
 */

import { atTime, randAmount, randInt } from "../lib/kernel";
import { buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateAtmWithdrawals(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const rule of ctx.user.atmWithdrawals) {
    for (const day of Array.from(monthlyOccurrences(from, to, rule.dayOfMonth))) {
      const amount = randAmount(ctx.rng, rule.amountRangeMilli[0], rule.amountRangeMilli[1], 100);
      const at = atTime(day, randInt(ctx.rng, 10, 20), randInt(ctx.rng, 0, 59));

      out.push(
        buildTx(ctx, {
          tag: "atm-out",
          date: at,
          merchantId: "mer_atm_withdrawal",
          accountSlug: rule.fromSlug,
          amountMilli: amount,
          direction: "debit",
          type: "atm_withdrawal",
          notes: "ATM cash withdrawal",
          paymentMethod: "atm",
        }),
      );
      out.push(
        buildTx(ctx, {
          tag: "atm-in",
          date: at,
          merchantId: "mer_atm_withdrawal",
          accountSlug: rule.toSlug,
          amountMilli: amount,
          direction: "credit",
          type: "atm_withdrawal",
          notes: "Cash withdrawn from ATM",
          paymentMethod: "atm",
        }),
      );
    }
  }
  return out;
}