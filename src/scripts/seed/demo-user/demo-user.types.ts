/**
 * scripts/seed/demo-user/demo-user.types.ts
 *
 * Replaces personas/persona.types.ts. Architectural decision: SplitFin now
 * ships ONE canonical demo account, not four thin personas. Splitting a
 * fixed "believable transaction budget" four ways produced four datasets
 * that each felt sparse; concentrating it into one account with a much
 * longer history (18 months) and a richer behavioural model produces one
 * dataset that actually feels like years of real use.
 *
 * Everything the old PersonaBlueprint could express, this can still
 * express — the shape below is a superset, not a rewrite from scratch —
 * plus three new primitives the "one very rich account" goal needs that
 * four flat personas never did:
 *
 *   - `salaryIncrement`: pay actually changes partway through the history,
 *     not on day one forever.
 *   - `seasonalMultipliers`: spending isn't flat month to month — festivals
 *     and December spend more, some months spend less.
 *   - `lifeEvents`: a small number of specific, dated, one-time story
 *     beats (a wedding, a medical emergency, a laptop upgrade) that a pure
 *     probability roll would never reliably place in a believable spot.
 *
 * The engine (finance/transactions.seed.ts and friends) is still generic
 * over this shape — it has no hardcoded knowledge of "Arjun Rao." A future
 * second demo account (if ever wanted) is one new blueprint file, same as
 * before; nothing here reintroduces persona-branching logic.
 */

import type { AccountBlueprint } from "../core/accounts.seed";
import type { RecurCadence, InvestmentKind, SplitGroupStatus } from "../lib/domain";

export interface IncomeEventBlueprint {
  merchantId: string;
  accountSlug: string;
  label: string;
  cadence: RecurCadence;
  dayOfMonth: number;
  amountRangeMilli: [number, number];
  /** Calendar-month filter (0=Jan..11=Dec) — e.g. an annual bonus that
   *  only lands in December, or a tax refund that only lands in March. */
  monthsActive?: number[];
}

export interface RecurringExpenseBlueprint {
  merchantId: string;
  accountSlug: string;
  label: string;
  cadence: RecurCadence;
  dayOfMonth: number;
  amountRangeMilli: [number, number];
}

/** A "story beat" of everyday discretionary spend — food, commute, etc. */
export interface SpendingHabitBlueprint {
  id: string; // stable slug for readable transaction ids
  merchantIds: string[];
  accountSlugs: string[];
  amountRangeMilli: [number, number];
  timesPerWeek: [number, number]; // inclusive range, resolved per week
  weekendMultiplier?: number; // >1 biases occurrences toward weekends
  hourRange?: [number, number];
}

/** Lower-frequency, higher-ticket spend or income (flights, electronics,
 *  medical, but also gift income, reimbursements, redemptions). */
export interface OccasionalEventBlueprint {
  id: string;
  merchantIds: string[];
  accountSlugs: string[];
  amountRangeMilli: [number, number];
  probabilityPerMonth: number; // 0–1
  note?: string;
  /** Defaults to "expense" — set "income" for gifts, reimbursements,
   *  redemptions, refunds, etc. */
  type?: "income" | "expense";
}

export interface TransferBlueprint {
  id: string;
  fromSlug: string;
  toSlug: string;
  cadence: RecurCadence;
  dayOfMonth: number;
  amountRangeMilli: [number, number];
  reason: string;
}

export interface SplitContactBlueprint {
  id: string;
  name: string;
}

export interface SplitGroupBlueprint {
  id: string;
  name: string;
  icon: string;
  memberIds: string[]; // references SplitContactBlueprint.id
  /** What kind of shared spend this group represents — descriptive only,
   *  feeds docs/demo-data-timeline.md; the actual seeded numbers below are
   *  explicit so the dataset is deterministic rather than derived from a
   *  probability roll over "timesPerMonth". */
  expenseDescription: string;
  /** Overall group state exactly as the SplitPay UI's status filter reads
   *  it — drives the seeded splitGroups.status/amount/totalAmount. */
  status: SplitGroupStatus;
  /** Total amount the group's shared expenses added up to. For a
   *  "settled" group this is the group's full lifetime spend (its
   *  history), already netted to zero per member. */
  totalAmountMilli: number;
  /** Net balance per member, in milliunits. Positive = that member owes
   *  the demo user; negative = the demo user owes that member. Ignored
   *  (all zero) when status is "settled" — a settled group's members
   *  carry no outstanding balance by definition. */
  memberNetBalanceMilli: Record<string, number>;
}

/** One monthly interest credit on an interest-bearing account (savings).
 *  Real banks credit interest quarterly at a computed rate; this demo
 *  models it as a small, deterministic monthly credit instead — simpler,
 *  and it exercises the "Interest" category every month rather than once
 *  a quarter. */
export interface InterestBlueprint {
  accountSlug: string;
  merchantId: string;
  dayOfMonth: number;
  amountRangeMilli: [number, number];
}

/** A single ATM cash withdrawal cycle: a debit leg on the funding account
 *  and a credit leg on the cash account, both tagged `type: "atm_withdrawal"`
 *  — distinct from a generic internal transfer. */
export interface AtmWithdrawalBlueprint {
  fromSlug: string;
  toSlug: string;
  dayOfMonth: number;
  amountRangeMilli: [number, number];
}

/** The monthly credit-card bill payment. Unlike every other transfer, its
 *  amount isn't a fixed range — it's computed from what was actually
 *  charged to `cardSlug` the previous statement cycle, so the card's
 *  balance genuinely comes back down to (near) zero the way a real
 *  "pay in full" cardholder's statement does. */
export interface CardPaymentBlueprint {
  fromSlug: string;
  cardSlug: string;
  dayOfMonth: number;
  /** Fraction of last month's card spend actually paid off (1 = paid in
   *  full). Kept slightly below 1 (e.g. 0.97) so rounding never produces
   *  an accidental small credit balance on the card. */
  payoffRatio: number;
}

export interface InvestmentBlueprint {
  id: string;
  kind: InvestmentKind;
  label: string;
  institutionId: string;
  linkedAccountSlug: string;
  monthlyContributionMilli: number | null;
  startedMonthsAgo: number;
  approxAnnualGrowthPercent: number;
}

export interface BillBlueprint {
  id: string;
  merchantId: string;
  label: string;
  amountRangeMilli: [number, number];
  dueDayOfMonth: number;
  autopay: boolean;
  linkedAccountSlug: string;
}

export interface SubscriptionBlueprint {
  id: string;
  merchantId: string;
  label: string;
  amountMilli: number;
  cadence: RecurCadence;
  billingDayOfMonth: number;
  linkedAccountSlug: string;
}

// ─── New: temporal storytelling primitives ───────────────────────────────────

/** A one-time step-change to a named income event, e.g. "salary goes up
 *  18% starting month 12." Applied multiplicatively to that income event's
 *  amountRangeMilli from `afterMonthIndex` onward (0-based from history start). */
export interface SalaryIncrementBlueprint {
  incomeLabel: string; // must match an IncomeEventBlueprint.label
  afterMonthIndex: number;
  incrementPercent: number;
}

/**
 * A month-of-year (0=Jan..11=Dec) spending multiplier applied to specific
 * spending habits — this is what makes October–November (festival season)
 * and December actually spend more, and what makes a post-vacation month
 * spend less, without hand-placing every affected transaction.
 */
export interface SeasonalMultiplierBlueprint {
  id: string;
  monthsOfYear: number[]; // 0=Jan..11=Dec
  habitIds: string[] | "all";
  multiplier: number; // 1.6 = 60% more occurrences that month; 0.6 = 40% less
  label: string;
}

/**
 * A specific, dated, one-time narrative beat — a wedding, a medical
 * emergency, a laptop upgrade, a tax payment. `monthIndex` is 0-based from
 * the start of the history window; `dayOfMonth` places it precisely so two
 * life events never collide on the same timestamp.
 */
export interface LifeEventBlueprint {
  id: string;
  monthIndex: number;
  dayOfMonth: number;
  type: "income" | "expense";
  merchantId: string;
  accountSlug: string;
  amountRangeMilli: [number, number];
  label: string;
}

export interface DemoUserBlueprint {
  displayName: string;
  email: string;
  joinedMonthsAgo: number;
  historyMonths: number;
  /** Total transaction-count band the generated history is expected to
   *  land in — validated at the end of the seed run (see
   *  core/analytics.generator.ts). Per the product spec this is
   *  300–450 total, i.e. roughly 20–30 per month over historyMonths. */
  targetTransactionRange: [number, number];

  accounts: AccountBlueprint[];
  incomeEvents: IncomeEventBlueprint[];
  recurringExpenses: RecurringExpenseBlueprint[];
  spendingHabits: SpendingHabitBlueprint[];
  occasionalEvents: OccasionalEventBlueprint[];
  /** Small, frequent reward credits — own generator (finance/cashback.generator.ts)
   *  rather than living in the generic occasionalEvents bucket. */
  cashbackEvents: OccasionalEventBlueprint[];
  /** Returned-order / tax / adjustment credits — own generator
   *  (finance/refund.generator.ts). */
  refundEvents: OccasionalEventBlueprint[];
  transfers: TransferBlueprint[];
  interest: InterestBlueprint[];
  atmWithdrawals: AtmWithdrawalBlueprint[];
  cardPayments: CardPaymentBlueprint[];

  salaryIncrements: SalaryIncrementBlueprint[];
  seasonalMultipliers: SeasonalMultiplierBlueprint[];
  lifeEvents: LifeEventBlueprint[];

  splitContacts: SplitContactBlueprint[];
  splitGroups: SplitGroupBlueprint[];

  investments: InvestmentBlueprint[];
  bills: BillBlueprint[];
  subscriptions: SubscriptionBlueprint[];
}