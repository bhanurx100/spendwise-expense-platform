/**
 * scripts/seed/lib/domain.ts
 *
 * Canonical domain types for SplitFin's financial model.
 *
 * These are not "seed types" — they are the entities the runtime app reads
 * through repositories/services once bank-sync, OCR, and manual entry all
 * write through the same tables. Seed files populate these tables; nothing
 * about their shape is demo-specific. If a field only makes sense for fake
 * data (e.g. "isDemoAccount"), it does not belong here — put it in a seed
 * run's own bookkeeping instead (see index.ts's SeedRunMeta).
 */

import type { OwnedEntity } from "./kernel";

// ─── Reference / core data (global, not per-user) ───────────────────────────

export interface Currency {
  code: string; // ISO 4217, e.g. "INR"
  symbol: string;
  decimals: number;
  name: string;
}

export interface Institution {
  id: string;
  name: string;
  kind: "bank" | "wallet" | "card-network" | "broker" | "payment-processor";
  country: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  kind: "income" | "expense" | "transfer";
  /** Top-level categories have no parent; this table is flat, subcategories reference it. */
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  icon: string;
}

export interface Merchant {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  logoKey: string; // maps to a static asset/lucide fallback, not stored binary
}

/** The user-editable rule a merchant resolves to. Seed data and real
 *  auto-categorization both go through this table — there is no seed-only
 *  categorization path. */
export interface MerchantRule {
  id: string;
  merchantId: string;
  categoryId: string;
  subcategoryId: string;
  /** false once a user has manually overridden the system default. */
  isSystemDefault: boolean;
}

// ─── Per-user core data ──────────────────────────────────────────────────────

export interface User extends OwnedEntity {
  id: string;
  name: string;
  email: string;
  timezone: string;
  locale: string;
  baseCurrency: string;
  personaSlug: string; // e.g. "software-engineer" — seed provenance only
  /**
   * The ONLY field that distinguishes a demo user from a real one. Every
   * other column, relationship, and downstream computation is identical.
   * Real users created via email/password or OAuth get isDemo: false and
   * otherwise flow through the exact same repositories/services — see
   * integration/auth-contract.ts.
   */
  isDemo: boolean;
}

/** Not a User-table column — kept in its own table so a real user's auth
 *  record never sits next to a plaintext password. Consumed only by the
 *  demo authentication provider (see integration/auth-contract.ts). Real
 *  users (password or OAuth) never have a row here. */
export interface DemoCredential {
  email: string;
  password: string;
  userId: string;
}

export type AccountType = "bank" | "credit-card" | "debit-card" | "wallet" | "cash" | "investment" | "loan";

export interface Account extends OwnedEntity {
  id: string;
  institutionId: string;
  name: string;
  type: AccountType;
  currency: string;
  /** Milliunits (₹1 = 1000), matching the existing schema's amount convention. */
  openingBalanceMilli: number;
  maskedNumber: string;
  linkedAccountId: string | null; // e.g. a debit card mirrors its savings account
  isPrimary: boolean;
}

export interface UserPreferences extends OwnedEntity {
  userId: string;
  theme: "system" | "light" | "dark";
  budgetingStyle: "envelope" | "fifty-thirty-twenty" | "none";
  notifyBillsDaysBefore: number;
  weekStartsOn: "sunday" | "monday";
}

// ─── Finance domain ──────────────────────────────────────────────────────────

/**
 * The full transaction "type" vocabulary a real ledger needs — not just
 * income/expense/transfer. Splitting `card_payment` and `atm_withdrawal`
 * out from the generic `transfer` bucket (and `cashback`/`interest`/
 * `refund`/`adjustment` out from `income`) is what lets the Transactions
 * screen's type filter, the Categories screen, and Monthly Reports each
 * show these as their own distinct, countable thing instead of everything
 * collapsing into "expense" or "transfer."
 */
export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "refund"
  | "cashback"
  | "interest"
  | "adjustment"
  | "card_payment"
  | "atm_withdrawal";

export type TransactionStatus = "completed" | "pending" | "failed";

/** Which leg of the ledger entry this is — independent of `type`, since
 *  both legs of a transfer/card-payment share the same `type` but move
 *  money in opposite directions. */
export type TransactionDirection = "debit" | "credit";

/** How the money actually moved — mirrors what a real bank statement or
 *  card network reports per line item. */
export type PaymentMethod =
  | "upi"
  | "credit_card"
  | "debit_card"
  | "cash"
  | "bank_transfer"
  | "wallet"
  | "auto_debit"
  | "atm";

export interface Transaction extends OwnedEntity {
  id: string;
  accountId: string;
  merchantId: string | null; // null for manual/uncategorized entries
  categoryId: string;
  subcategoryId: string | null;
  type: TransactionType;
  /** Milliunits; sign-free — direction comes from `direction`/`type`,
   *  matching how a bank feed or OCR receipt reports amounts (always
   *  positive-magnitude) rather than baking the sign into the number. */
  amountMilli: number;
  currency: string;
  date: Date;
  /** The counterparty's display name — merchant, payer, or landlord. This
   *  is what the UI shows as the transaction's headline. */
  merchantName: string;
  direction: TransactionDirection;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: TransactionStatus;
  isRecurring: boolean;
  recurringSeriesId: string | null;
  isSplit: boolean;
  splitExpenseId: string | null;
  hasReceipt: boolean;
  /** Set only when produced by the OCR/bill-scan pipeline in the future. */
  source: "manual" | "bank-sync" | "csv-import" | "ocr" | "seed";
}

export type RecurCadence = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringSeries extends OwnedEntity {
  id: string;
  accountId: string;
  merchantId: string;
  categoryId: string;
  label: string;
  cadence: RecurCadence;
  dayOfMonth: number | null; // for monthly/quarterly/yearly
  amountMilli: number;
  active: boolean;
}

export interface Transfer extends OwnedEntity {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountMilli: number;
  date: Date;
  reason: string;
  linkedTransactionIds: [string, string]; // the debit + credit legs
}

export interface Budget extends OwnedEntity {
  id: string;
  categoryId: string;
  monthKey: string; // "2026-07" or "recurring" for a standing budget
  limitMilli: number;
}

export interface Goal extends OwnedEntity {
  id: string;
  name: string;
  icon: string;
  targetMilli: number;
  currentMilli: number;
  targetDate: Date | null;
  linkedAccountId: string | null;
}

export type LoanKind = "home" | "auto" | "personal" | "education";

export interface Loan extends OwnedEntity {
  id: string;
  kind: LoanKind;
  lender: string;
  principalMilli: number;
  outstandingMilli: number;
  emiMilli: number;
  interestRateBps: number; // basis points, e.g. 850 = 8.50%
  tenureMonths: number;
  nextDueDate: Date;
  linkedAccountId: string;
}

export type InvestmentKind = "mutual-fund-sip" | "stocks" | "crypto" | "fixed-deposit" | "epf";

export interface Investment extends OwnedEntity {
  id: string;
  kind: InvestmentKind;
  label: string;
  institutionId: string;
  investedMilli: number;
  currentValueMilli: number;
  monthlyContributionMilli: number | null;
  startedOn: Date;
}

export interface Bill extends OwnedEntity {
  id: string;
  merchantId: string;
  categoryId: string;
  label: string;
  amountMilli: number;
  dueDate: Date;
  autopay: boolean;
  overdue: boolean;
  linkedAccountId: string;
}

export interface Subscription extends OwnedEntity {
  id: string;
  merchantId: string;
  label: string;
  amountMilli: number;
  cadence: RecurCadence;
  nextBillingDate: Date;
  linkedAccountId: string;
  active: boolean;
}

export type ReminderKind = "bill-due" | "loan-emi" | "goal-behind" | "settlement-request" | "budget-alert";

export interface Reminder extends OwnedEntity {
  id: string;
  kind: ReminderKind;
  title: string;
  body: string;
  dueDate: Date;
  dismissed: boolean;
  relatedEntityId: string | null;
}

// ─── SplitPay domain ─────────────────────────────────────────────────────────

/** A friend/contact in a split group. Not a platform User — SplitPay works
 *  with people who may never sign up, same as Splitwise/real apps. */
export interface SplitContact {
  id: string;
  name: string;
  avatarInitials: string;
}

export type SplitGroupStatus = "you-owe" | "you-are-owed" | "settled";

export interface SplitGroup extends OwnedEntity {
  id: string;
  name: string;
  icon: string;
  memberContactIds: string[];
  currency: string;
}

export interface SplitExpense extends OwnedEntity {
  id: string;
  groupId: string;
  paidByContactId: string | "self";
  description: string;
  totalMilli: number;
  categoryId: string;
  date: Date;
  /** Equal-split by default; per-share overrides live here when unequal. */
  shares: Array<{ contactId: string | "self"; amountMilli: number }>;
  linkedTransactionId: string | null;
}

export interface SplitSettlement extends OwnedEntity {
  id: string;
  groupId: string;
  fromContactId: string | "self";
  toContactId: string | "self";
  amountMilli: number;
  date: Date;
  method: "upi" | "cash" | "bank-transfer";
}

export interface SplitActivity extends OwnedEntity {
  id: string;
  groupId: string;
  kind: "expense-added" | "settlement-recorded" | "member-added" | "reminder-sent";
  actorContactId: string | "self";
  summary: string;
  at: Date;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationKind =
  | "bill-due"
  | "budget-exceeded"
  | "large-transaction"
  | "settlement-request"
  | "goal-milestone"
  | "recurring-detected";

export interface Notification extends OwnedEntity {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  relatedEntityId: string | null;
  at: Date;
}

// ─── Analytics (always derived, never hand-authored — see analytics/*) ──────

export interface DashboardSnapshot {
  userId: string;
  monthKey: string;
  netWorthMilli: number;
  availableToSpendMilli: number;
  savingsRatePercent: number;
  dailyBurnMilli: number;
  incomeMilli: number;
  expenseMilli: number;
}

export interface CashflowPoint {
  date: string; // ISO day or month key depending on granularity
  incomeMilli: number;
  expenseMilli: number;
  netMilli: number;
}

export interface SpendingByCategory {
  categoryId: string;
  monthKey: string;
  totalMilli: number;
  transactionCount: number;
  percentOfTotal: number;
}

export interface Insight {
  id: string;
  userId: string;
  kind: "top-category" | "biggest-saving" | "unusual-spend" | "recurring-increase" | "goal-progress";
  copy: string; // plain, specific, human — never "Analysis complete."
  generatedAt: Date;
}

export interface MonthlyReport {
  userId: string;
  monthKey: string;
  incomeMilli: number;
  expenseMilli: number;
  netMilli: number;
  topCategories: Array<{ categoryId: string; totalMilli: number }>;
}