import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { AdapterAccountType } from "next-auth/adapters";

/* ────────────────────────────────────────────────────────────────────────
 * AUTH.JS TABLES
 *
 * NOTE: Auth.js's standard schema calls its OAuth-link table "accounts".
 * This project already has a business table called "accounts" (bank /
 * wallet / credit-card accounts) — so the Auth.js one is named
 * `authAccounts` here to avoid any collision. Everything else follows the
 * official @auth/drizzle-adapter Postgres schema.
 * ──────────────────────────────────────────────────────────────────────── */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // permanent internal UUID — never a provider ID
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),

  // Product-specific fields, additive to the Auth.js baseline
  provider: text("provider"), // "google" | "credentials" (demo) | future providers
  providerAccountId: text("provider_account_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  lastLogin: timestamp("last_login", { mode: "date" }),
  status: text("status").notNull().default("active"), // "active" | "suspended"
  isDemo: boolean("is_demo").notNull().default(false),
});

export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  authAccounts: many(authAccounts),
  sessions: many(sessions),
  accounts: many(accounts), // business accounts (bank/wallet/etc.)
  categories: many(categories),
}));

/* ────────────────────────────────────────────────────────────────────────
 * BUSINESS TABLES — unchanged shape, userId now has a real FK to users.id
 * instead of an untyped opaque Clerk string.
 * ──────────────────────────────────────────────────────────────────────── */

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("bank"),
  institution: text("institution").notNull().default(""),
  openingBalance: integer("opening_balance").notNull().default(0), // milliunits — balance on the day the account was added to the app
  currentBalance: integer("current_balance").notNull().default(0), // milliunits — opening_balance + SUM(transactions.amount); auto-maintained by a DB trigger, see setup-balance-sync.ts
  maskedNumber: text("masked_number"),
  isPrimary: boolean("is_primary").notNull().default(false),
  linkedAccountId: text("linked_account_id"),
}, (table) => ({
  userIdIdx: index("accounts_user_id_idx").on(table.userId),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const insertAccountSchema = createInsertSchema(accounts);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  userIdIdx: index("categories_user_id_idx").on(table.userId),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const insertCategorySchema = createInsertSchema(categories);

export const subcategories = pgTable("subcategories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("subcategories_user_id_idx").on(table.userId),
  categoryIdIdx: index("subcategories_category_id_idx").on(table.categoryId),
}));

export const insertSubcategorySchema = createInsertSchema(subcategories).pick({ categoryId: true, name: true });

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  payee: text("payee").notNull(), // merchant / counterparty display name
  notes: text("notes"),
  date: timestamp("date", { mode: "date" }).notNull(),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  subcategoryId: text("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),

  // Ledger metadata — additive columns, all backward-compatible (existing
  // rows/insert paths that don't set these fall back to the defaults
  // below, and map-transaction.ts still derives a value when one of these
  // is missing, so this is not a breaking API change).
  //
  // "income" | "expense" | "transfer" | "refund" | "cashback" | "interest"
  // | "adjustment" | "card_payment" | "atm_withdrawal"
  type: text("type").notNull().default("expense"),
  // "completed" | "pending" | "failed" — a failed/declined transaction is
  // still recorded (so it's visible in history) but is excluded from every
  // balance/reconciliation calculation; see seed/core/balance.generator.ts.
  status: text("status").notNull().default("completed"),
  // "debit" | "credit" — which way money moved for THIS account/row. The
  // signed `amount` column above is always `direction === 'credit' ?
  // +magnitude : -magnitude`; this column is what makes that rule legible
  // (and re-derivable) without having to inspect the sign of `amount`.
  direction: text("direction").notNull().default("debit"),
  // "upi" | "credit_card" | "debit_card" | "cash" | "bank_transfer" |
  // "wallet" | "auto_debit" | "atm"
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
}, (table) => ({
  // Covers: listTransactions' join+filter+ORDER BY date DESC, and
  // balance-repository's GROUP BY accountId aggregation.
  accountIdDateIdx: index("transactions_account_id_date_idx").on(table.accountId, table.date),
  categoryIdIdx: index("transactions_category_id_idx").on(table.categoryId),
  typeIdx: index("transactions_type_idx").on(table.type),
  statusIdx: index("transactions_status_idx").on(table.status),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  categories: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
});

/** SplitPay records are first-class, tenant-owned data rather than UI fixtures. */
export const splitGroups = pgTable("split_groups", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  name: text("name").notNull(),
  emojiIcon: text("emoji_icon").notNull().default("receipt"),
  status: text("status").notNull().default("you-owe"),
  amount: integer("amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0),
  currency: text("currency").notNull().default("INR"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("split_groups_user_id_idx").on(table.userId),
}));

export const splitMembers = pgTable("split_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: text("group_id").notNull().references(() => splitGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  netBalance: integer("net_balance").notNull().default(0),
  direction: text("direction").notNull().default("settled"),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("split_members_user_id_idx").on(table.userId),
  groupIdIdx: index("split_members_group_id_idx").on(table.groupId),
}));

export const insertSplitGroupSchema = createInsertSchema(splitGroups).pick({ name: true, emojiIcon: true, status: true, amount: true, totalAmount: true, currency: true });
export const insertSplitMemberSchema = createInsertSchema(splitMembers).pick({ groupId: true, name: true, avatar: true, netBalance: true, direction: true });