import type { Metadata } from "next";

export const siteConfig: Metadata = {
  title: "Splitfin",
  description: "Track your income and expenses with Splitfin.",
  keywords: [
    "reactjs",
    "nextjs",
    "vercel",
    "react",
    "drizzle-orm",
    "drizzle",
    "shadcn",
    "shadcn-ui",
    "radix-ui",
    "cn",
    "clsx",
    "finance-app",
    "transactions",
    "dashboard",
    "accounts",
    "auth-js",
    "next-auth",
    "neon-db",
    "sonner",
    "zustand",
    "zod",
    "sql",
    "postgresql",
    "honojs",
    "honojs-api",
    "hono-api",
    "lucide-react",
    "recharts",
    "postcss",
    "prettier",
    "react-dom",
    "tailwindcss",
    "tailwindcss-animate",
    "ui/ux",
    "js",
    "javascript",
    "typescript",
    "eslint",
    "html",
    "css",
  ] as Array<string>,
  authors: {
    name: "Bhanuprasad",
    url: "https://github.com/bhanurx100/splitfin-expense-platform",
  },
} as const;

export const links = {
  sourceCode: "https://github.com/bhanurx100/splitfin-expense-platform",
} as const;
/**
 * SplitFin Core Types
 * All domain model interfaces and utility types.
 */

import type { SplitType, CurrencyCode, ActivityType, MemberRole, SettlementStatus, PaymentMethodId, ExpenseCategoryId } from "@/src/config/constants"

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:        string
  name:      string
  email:     string
  phone?:    string
  image?:    string
  createdAt: string
}

export interface UserProfile extends User {
  totalGroups:    number
  totalExpenses:  number
}

// ─── Group ────────────────────────────────────────────────────────────────────

export interface Group {
  id:          string
  name:        string
  description?:string
  emoji:       string
  currency:    CurrencyCode
  createdById: string
  createdAt:   string
  updatedAt:   string
}

export interface GroupWithStats extends Group {
  memberCount:      number
  expenseCount:     number
  totalExpenses:    number
  settledAmount:    number
  pendingCount:     number
  settledCount:     number
  lastSettledAt?:   string
  /** Your net balance in this group. Positive = you will receive */
  yourBalance:      number
}

// ─── Member ───────────────────────────────────────────────────────────────────

export interface GroupMember {
  id:       string
  groupId:  string
  userId:   string
  role:     MemberRole
  joinedAt: string
  user:     User
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export interface Expense {
  id:          string
  groupId:     string
  title:       string
  amount:      number
  currency:    CurrencyCode
  category:    ExpenseCategoryId
  splitType:   SplitType
  note?:       string
  createdById: string
  createdAt:   string
  updatedAt:   string
  payers:      ExpensePayer[]
  participants:ExpenseParticipant[]
}

export interface ExpensePayer {
  id:         string
  expenseId:  string
  userId:     string
  amountPaid: number
  user:       User
}

export interface ExpenseParticipant {
  id:        string
  expenseId: string
  userId:    string
  share:     number
  user:      User
}

// ─── Settlement ───────────────────────────────────────────────────────────────

export interface Settlement {
  id:        string
  groupId:   string
  payerId:   string
  receiverId:string
  amount:    number
  currency:  CurrencyCode
  status:    SettlementStatus
  method?:   PaymentMethodId
  paidAt?:   string
  createdAt: string
  payer:     User
  receiver:  User
}

/** Simplified settlement transaction (output of simplify algorithm) */
export interface SimplifiedDebt {
  from:   User
  to:     User
  amount: number
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export interface MemberBalance {
  user:    User
  /** Positive = this person is owed money, Negative = this person owes */
  net:     number
  paid:    number
  share:   number
}

export interface GroupBalanceSummary {
  /** What YOU will receive */
  youWillReceive: number
  /** What YOU will pay */
  youWillPay:     number
  /** Your net balance */
  yourNet:        number
  memberBalances: MemberBalance[]
  debts:          SimplifiedDebt[]
}

// ─── Activity / Timeline ──────────────────────────────────────────────────────

export interface ActivityItem {
  id:         string
  groupId:    string
  type:       ActivityType
  entityId?:  string   // expense id, settlement id, etc.
  userId:     string
  metadata:   ActivityMetadata
  createdAt:  string
  user:       User
}

export type ActivityMetadata =
  | ExpenseCreatedMeta
  | ExpenseEditedMeta
  | ExpenseDeletedMeta
  | PaymentMarkedMeta
  | PaymentDetectedMeta
  | SettledMeta

export interface ExpenseCreatedMeta {
  type:        "expense_created"
  expenseId:   string
  title:       string
  amount:      number
  paidByNames: string[]
}

export interface ExpenseEditedMeta {
  type:      "expense_edited"
  expenseId: string
  title:     string
  changes:   string[]
}

export interface ExpenseDeletedMeta {
  type:      "expense_deleted"
  title:     string
  amount:    number
}

export interface PaymentMarkedMeta {
  type:       "payment_marked"
  amount:     number
  toUserId:   string
  toUserName: string
  method?:    PaymentMethodId
}

export interface PaymentDetectedMeta {
  type:             "payment_detected"
  amount:           number
  fromUserId:       string
  fromUserName:     string
  via:              string
  transactionId?:   string
}

export interface SettledMeta {
  type:   "settled"
  amount: number
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?:    T
  error?:   string
  message?: string
}

export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  pageSize:   number
  hasMore:    boolean
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface CreateGroupForm {
  name:        string
  description?:string
  emoji:       string
  currency:    CurrencyCode
  splitType:   SplitType
  memberEmails:string[]
}

export interface AddExpenseForm {
  title:       string
  amount:      number | ""
  category:    ExpenseCategoryId
  splitType:   SplitType
  note?:       string
  payers:      { userId: string; amount: number }[]
  participants:{ userId: string; share: number }[]
}

export interface MarkPaidForm {
  toUserId:     string
  amount:       number
  method:       PaymentMethodId
  note?:        string
  paidInCash?:  boolean
}

// ─── Component Prop Helpers ───────────────────────────────────────────────────

export type ClassName = string | undefined | null | false

export interface WithClassName {
  className?: string
}

export interface WithChildren {
  children: React.ReactNode
}

export interface WithChildrenAndClassName extends WithClassName, WithChildren {}

// ─── Utility ─────────────────────────────────────────────────────────────────

export type Nullable<T>  = T | null
export type Optional<T>  = T | undefined
export type ID           = string
export type ISODateString= string
export type Amount       = number  // always in minor currency unit (paise, cents)

/** Deep partial — all fields optional recursively */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}