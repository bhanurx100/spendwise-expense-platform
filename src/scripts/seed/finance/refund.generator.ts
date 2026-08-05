/**
 * scripts/seed/finance/refund.generator.ts
 *
 * Single responsibility: refund-type credits (returned orders, the annual
 * income-tax refund). Kept separate from cashback.generator.ts even though
 * the mechanics look similar — refunds and cashback are a different
 * category/subcategory and a real user's mental model treats them
 * differently ("I got my money back" vs "I earned a reward").
 */

import { addDays, addMonths, atTime, chance, randAmount, randInt } from "../lib/kernel";
import { buildTx, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateRefunds(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor.getTime() <= to.getTime()) {
    for (const event of ctx.user.refundEvents) {
      if (chance(ctx.rng, event.probabilityPerMonth)) {
        const day = addDays(cursor, randInt(ctx.rng, 0, 26));
        if (day.getTime() >= from.getTime() && day.getTime() <= to.getTime()) {
          const merchantId = event.merchantIds[randInt(ctx.rng, 0, event.merchantIds.length - 1)];
          const accountSlug = event.accountSlugs[randInt(ctx.rng, 0, event.accountSlugs.length - 1)];
          const amount = randAmount(ctx.rng, event.amountRangeMilli[0], event.amountRangeMilli[1], 100);
          out.push(
            buildTx(ctx, {
              tag: `refund-${event.id}`,
              date: atTime(day, randInt(ctx.rng, 9, 21), randInt(ctx.rng, 0, 59)),
              merchantId,
              accountSlug,
              amountMilli: amount,
              direction: "credit",
              type: "refund",
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