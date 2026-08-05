/**
 * scripts/seed/finance/transfer.generator.ts
 *
 * Single responsibility: money moving between the user's OWN accounts.
 * Two distinct shapes:
 *
 *   - `generateInternalTransfers`: plain blueprint-driven transfers
 *     (salary sweep to savings, UPI wallet top-up) — a fixed amount range,
 *     no dependency on anything else generated.
 *
 *   - `generateCardPayments`: the monthly credit-card bill payment. This
 *     one is NOT a fixed amount range — it's computed from what was
 *     actually charged to the card the previous statement cycle, times
 *     `payoffRatio`, so the card's balance genuinely comes back down
 *     toward zero the way a real "pay in full" cardholder's statement
 *     does. This is a second pass: it must run after every expense-side
 *     generator has already produced the card's spend transactions.
 *
 * Every transfer is two linked legs (a debit and a credit), both carrying
 * an explicit `direction` — never a signed amount baked in by the caller.
 */

import { atTime, randAmount, randInt } from "../lib/kernel";
import { acct, buildTx, monthlyOccurrences, type EngineContext } from "../lib/engine";
import type { Transaction } from "../lib/domain";

export function generateInternalTransfers(ctx: EngineContext, from: Date, to: Date): Transaction[] {
  const out: Transaction[] = [];
  const nameBySlug = new Map(ctx.user.accounts.map((a) => [a.slug, a.name]));

  for (const bp of ctx.user.transfers) {
    const toName = nameBySlug.get(bp.toSlug) ?? bp.toSlug;
    const fromName = nameBySlug.get(bp.fromSlug) ?? bp.fromSlug;
    for (const day of Array.from(monthlyOccurrences(from, to, bp.dayOfMonth))) {
      const amount = randAmount(ctx.rng, bp.amountRangeMilli[0], bp.amountRangeMilli[1], 100);
      const at = atTime(day, randInt(ctx.rng, 9, 18), randInt(ctx.rng, 0, 59));

      out.push(
        buildTx(ctx, {
          tag: "transfer-out",
          date: at,
          merchantId: null,
          merchantName: toName,
          accountSlug: bp.fromSlug,
          amountMilli: amount,
          direction: "debit",
          type: "transfer",
          notes: `${bp.reason} → ${toName}`,
        }),
      );
      out.push(
        buildTx(ctx, {
          tag: "transfer-in",
          date: at,
          merchantId: null,
          merchantName: fromName,
          accountSlug: bp.toSlug,
          amountMilli: amount,
          direction: "credit",
          type: "transfer",
          notes: `${bp.reason} ← ${fromName}`,
        }),
      );
    }
  }
  return out;
}

/** This month's total *spend* on `cardSlug` — expenses, subscriptions,
 *  recurring bills, everything with `direction: "debit"` posted to the
 *  card. Card payments themselves are excluded (they're `direction:
 *  "credit"` on the card, so they wouldn't match anyway), and only
 *  `status: "completed"` rows count — a declined charge never became debt
 *  to pay off. */
function monthlyCardSpend(cardAccountId: string, priorTransactions: Transaction[], monthStart: Date, monthEnd: Date): number {
  let total = 0;
  for (const t of priorTransactions) {
    if (t.accountId !== cardAccountId) continue;
    if (t.direction !== "debit") continue;
    if (t.status !== "completed") continue;
    if (t.date.getTime() < monthStart.getTime() || t.date.getTime() > monthEnd.getTime()) continue;
    total += t.amountMilli;
  }
  return total;
}

export function generateCardPayments(ctx: EngineContext, from: Date, to: Date, priorTransactions: Transaction[]): Transaction[] {
  const out: Transaction[] = [];
  const nameBySlug = new Map(ctx.user.accounts.map((a) => [a.slug, a.name]));

  for (const bp of ctx.user.cardPayments) {
    const cardAccountId = acct(bp.cardSlug);
    const cardName = nameBySlug.get(bp.cardSlug) ?? bp.cardSlug;
    const fromName = nameBySlug.get(bp.fromSlug) ?? bp.fromSlug;

    for (const day of Array.from(monthlyOccurrences(from, to, bp.dayOfMonth))) {
      // Bill for the statement cycle that just closed — the calendar
      // month immediately before this payment date.
      const statementMonthStart = new Date(day.getFullYear(), day.getMonth() - 1, 1);
      const statementMonthEnd = new Date(day.getFullYear(), day.getMonth(), 0, 23, 59, 59, 999);
      const spend = monthlyCardSpend(cardAccountId, priorTransactions, statementMonthStart, statementMonthEnd);
      if (spend <= 0) continue; // nothing to pay off yet (e.g. the very first cycle)

      const amount = Math.round((spend * bp.payoffRatio) / 100) * 100;
      const at = atTime(day, randInt(ctx.rng, 9, 18), randInt(ctx.rng, 0, 59));

      out.push(
        buildTx(ctx, {
          tag: "cc-payment-out",
          date: at,
          merchantId: "mer_credit_card_payment",
          accountSlug: bp.fromSlug,
          amountMilli: amount,
          direction: "debit",
          type: "card_payment",
          notes: `Credit card bill payment → ${cardName}`,
        }),
      );
      out.push(
        buildTx(ctx, {
          tag: "cc-payment-in",
          date: at,
          merchantId: "mer_credit_card_payment",
          accountSlug: bp.cardSlug,
          amountMilli: amount,
          direction: "credit",
          type: "card_payment",
          notes: `Credit card bill payment ← ${fromName}`,
        }),
      );
    }
  }
  return out;
}