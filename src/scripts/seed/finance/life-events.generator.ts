/**
 * scripts/seed/finance/life-events.generator.ts
 *
 * Single responsibility: `lifeEvents` — specific, dated, one-time
 * narrative beats (a MacBook purchase, a Goa trip, a medical emergency, a
 * salary bonus). A probability roll is the wrong tool for "this happens
 * once, in month 9" — these get their own generator so they land exactly
 * where the blueprint places them, never colliding with anything else.
 */

import { atTime, randAmount, randInt } from "../lib/kernel";
import { buildTx, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateLifeEvents(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const event of ctx.user.lifeEvents) {
    const day = new Date(from.getFullYear(), from.getMonth() + event.monthIndex, event.dayOfMonth);
    if (day.getTime() < from.getTime() || day.getTime() > to.getTime()) continue;
    const amount = randAmount(ctx.rng, event.amountRangeMilli[0], event.amountRangeMilli[1], 100);
    const isIncome = event.type === "income";
    out.push(
      buildTx(ctx, {
        tag: `life-${event.id}`,
        date: atTime(day, randInt(ctx.rng, 10, 20), randInt(ctx.rng, 0, 59)),
        merchantId: event.merchantId,
        accountSlug: event.accountSlug,
        amountMilli: amount,
        direction: isIncome ? "credit" : "debit",
        type: isIncome ? "income" : "expense",
        notes: event.label,
      }),
    );
  }
  return out;
}