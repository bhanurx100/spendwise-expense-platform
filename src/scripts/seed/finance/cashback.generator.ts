/**
 * scripts/seed/finance/cashback.generator.ts
 *
 * Single responsibility: small, frequent reward-credit transactions
 * ("Cashback" category). Kept separate from the generic occasional-events
 * bucket so it's independently tunable and easy to find.
 */

import { addDays, addMonths, atTime, chance, randAmount, randInt } from "../lib/kernel";
import { buildTx, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateCashback(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor.getTime() <= to.getTime()) {
    for (const event of ctx.user.cashbackEvents) {
      if (chance(ctx.rng, event.probabilityPerMonth)) {
        const day = addDays(cursor, randInt(ctx.rng, 0, 26));
        if (day.getTime() >= from.getTime() && day.getTime() <= to.getTime()) {
          const merchantId = event.merchantIds[randInt(ctx.rng, 0, event.merchantIds.length - 1)];
          const accountSlug = event.accountSlugs[randInt(ctx.rng, 0, event.accountSlugs.length - 1)];
          const amount = randAmount(ctx.rng, event.amountRangeMilli[0], event.amountRangeMilli[1], 10);
          out.push(
            buildTx(ctx, {
              tag: `cashback-${event.id}`,
              date: atTime(day, randInt(ctx.rng, 9, 21), randInt(ctx.rng, 0, 59)),
              merchantId,
              accountSlug,
              amountMilli: amount,
              direction: "credit",
              type: "cashback",
              notes: event.note,
            }),
          );
        }
      }
    }
    cursor = addMonths(cursor, 1);
  }
  return out;
}