/**
 * scripts/seed/lib/engine.ts
 *
 * Shared plumbing every finance/*.generator.ts file uses to build a
 * `Transaction` row. Pulling this out of one 400-line "god file" is what
 * makes the individual generators (salary, expense, subscription, cashback,
 * refund, interest, atm, investment, transfer, life-events) genuinely
 * single-responsibility instead of copy-pasted variations of each other.
 *
 * The one rule that matters most for correctness lives here and nowhere
 * else: **every transaction's `amountMilli` is an unsigned magnitude.**
 * No generator ever emits a negative number. Which way the money actually
 * moved is *only* ever expressed through `direction` ("debit" | "credit").
 * The final signed ledger amount stored in Postgres is computed exactly
 * once, in run-seed.ts, as:
 *
 *     signedAmount = direction === "credit" ? +amountMilli : -amountMilli
 *
 * Earlier drafts of this seed had two different conventions live at once —
 * `transactions.seed.ts` emitted unsigned magnitudes and let `type` imply
 * the sign, while `transfers.seed.ts` emitted pre-signed amounts and relied
 * on the inserter to *not* re-negate them. That split is exactly the kind
 * of inconsistency that produces balances that don't reconcile, so it's
 * been collapsed into the single rule above everywhere in this codebase.
 */

import { accountId } from "../core/accounts.seed";
import { resolveMerchant } from "../core/merchant-rules.seed";
import { getMerchant } from "../core/merchants.seed";
import { addMonths, chance, makeId, owned, type Rng } from "./kernel";
import { DEMO_USER_SLUG } from "./constants";
import type { DemoUserBlueprint } from "../demo-user/demo-user.types";
import type { PaymentMethod, Transaction, TransactionDirection, TransactionStatus, TransactionType } from "./domain";

export interface EngineContext {
  user: DemoUserBlueprint;
  userId: string;
  rng: Rng;
  seq: { n: number };
}

export function nextId(ctx: EngineContext, tag: string): string {
  ctx.seq.n += 1;
  return makeId(DEMO_USER_SLUG, `tx-${tag}`, ctx.seq.n);
}

export function acct(slug: string): string {
  return accountId(DEMO_USER_SLUG, slug);
}

/** Every account "type" implies a default real-world payment rail — this
 *  is what lets every transaction carry an accurate `paymentMethod`
 *  without every single generator call site having to specify one. */
export function defaultPaymentMethodFor(user: DemoUserBlueprint, accountSlug: string): PaymentMethod {
  const account = user.accounts.find((a) => a.slug === accountSlug);
  switch (account?.type) {
    case "credit-card":
      return "credit_card";
    case "wallet":
      return "upi";
    case "cash":
      return "cash";
    case "bank":
    default:
      return "bank_transfer";
  }
}

export interface BuildTxOptions {
  tag: string;
  date: Date;
  merchantId: string | null;
  merchantName?: string; // required when merchantId is null
  accountSlug: string;
  amountMilli: number; // always a positive magnitude — see file header
  direction: TransactionDirection;
  type: TransactionType;
  notes?: string | null;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  isRecurring?: boolean;
  recurringSeriesId?: string | null;
}

/** The single constructor every generator calls to build one ledger row.
 *  Resolves category/subcategory through the merchant-rule table (never
 *  hardcoded), fills in a sensible default payment method from the
 *  account type, and stamps ownership — nothing downstream should ever
 *  need to build a Transaction object by hand. */
export function buildTx(ctx: EngineContext, opts: BuildTxOptions): Transaction {
  const resolved = opts.merchantId ? resolveMerchant(opts.merchantId) : null;
  const merchantName = opts.merchantId ? getMerchant(opts.merchantId).name : opts.merchantName ?? "Manual Entry";

  if (opts.amountMilli < 0) {
    // Hard invariant, not a style preference — see file header. Fail loud
    // and immediately rather than silently letting a signed amount slip
    // into the ledger and desync the balance engine downstream.
    throw new Error(`buildTx received a negative amountMilli (${opts.amountMilli}) for tag "${opts.tag}" — amounts must always be unsigned magnitudes; use \`direction\` instead.`);
  }

  return {
    id: nextId(ctx, opts.tag),
    accountId: acct(opts.accountSlug),
    merchantId: opts.merchantId,
    categoryId: resolved?.categoryId ?? "cat_others",
    subcategoryId: resolved?.subcategoryId ?? null,
    type: opts.type,
    amountMilli: opts.amountMilli,
    currency: "INR",
    date: opts.date,
    merchantName,
    direction: opts.direction,
    paymentMethod: opts.paymentMethod ?? defaultPaymentMethodFor(ctx.user, opts.accountSlug),
    notes: opts.notes ?? null,
    status: opts.status ?? "completed",
    isRecurring: opts.isRecurring ?? false,
    recurringSeriesId: opts.recurringSeriesId ?? null,
    isSplit: false,
    splitExpenseId: null,
    hasReceipt: opts.type === "expense" && chance(ctx.rng, 0.3),
    source: "seed",
    ...owned(ctx.userId, opts.date),
  };
}

// ─── Shared month-cycle walkers ─────────────────────────────────────────────

/** Every occurrence of `dayOfMonth` between `from` and `to`, inclusive,
 *  clamped to day 28 so a blueprint's `dayOfMonth: 30` never crashes on
 *  February. */
export function* monthlyOccurrences(from: Date, to: Date, dayOfMonth: number): Generator<Date> {
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor.getTime() <= to.getTime()) {
    const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(dayOfMonth, 28));
    if (occurrence.getTime() >= from.getTime() && occurrence.getTime() <= to.getTime()) {
      yield occurrence;
    }
    cursor = addMonths(cursor, 1);
  }
}

/** 0-based month index from the start of the history window — what
 *  `salaryIncrements[].afterMonthIndex` and `lifeEvents[].monthIndex` are
 *  expressed in. */
export function monthIndexSince(from: Date, date: Date): number {
  return (date.getFullYear() - from.getFullYear()) * 12 + (date.getMonth() - from.getMonth());
}

export function isoMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}