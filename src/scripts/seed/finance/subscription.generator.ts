/**
 * scripts/seed/finance/subscription.generator.ts
 *
 * Single responsibility: `subscriptions` (Netflix, Spotify, Prime) → the
 * actual successful renewal charge, plus a small, realistic rate of
 * declined-payment attempts. Real payment histories aren't 100%
 * successful — a card can be expired or a wallet can be short on balance,
 * and the failed attempt still shows up in the ledger with
 * `status: "failed"` before a later successful charge, exactly the way a
 * bank statement records it. Failed rows are inserted into the database
 * (so the Transactions screen can show them) but excluded from every
 * balance/reconciliation calculation — a declined payment never actually
 * moved money.
 */

import { addDays, addMonths, atTime, cadenceStepMonths, chance, randInt } from "../lib/kernel";
import { buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateSubscriptionCharges(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  for (const sub of ctx.user.subscriptions) {
    const step = cadenceStepMonths(sub.cadence);
    let cycleIndex = 0;
    for (const day of Array.from(monthlyOccurrences(from, to, sub.billingDayOfMonth))) {
      const fires = cycleIndex % step === 0;
      cycleIndex += 1;
      if (!fires) continue;
      out.push(
        buildTx(ctx, {
          tag: `sub-${sub.id}`,
          date: atTime(day, 6, randInt(ctx.rng, 0, 40)),
          merchantId: sub.merchantId,
          accountSlug: sub.linkedAccountSlug,
          amountMilli: sub.amountMilli,
          direction: "debit",
          type: "expense",
          notes: sub.label,
          isRecurring: true,
        }),
      );
    }
  }
  return out;
}

export function generateFailedSubscriptionPayments(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  const candidates = ctx.user.subscriptions;
  if (candidates.length === 0) return out;

  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor.getTime() <= to.getTime()) {
    if (chance(ctx.rng, 0.15)) {
      const sub = candidates[randInt(ctx.rng, 0, candidates.length - 1)];
      const day = addDays(cursor, randInt(ctx.rng, 0, 26));
      if (day.getTime() >= from.getTime() && day.getTime() <= to.getTime()) {
        out.push(
          buildTx(ctx, {
            tag: "failed",
            date: atTime(day, randInt(ctx.rng, 8, 20), randInt(ctx.rng, 0, 59)),
            merchantId: sub.merchantId,
            accountSlug: sub.linkedAccountSlug,
            amountMilli: sub.amountMilli,
            direction: "debit",
            type: "expense",
            notes: `${sub.label} — payment declined`,
            status: "failed",
          }),
        );
      }
    }
    cursor = addMonths(cursor, 1);
  }
  return out;
}