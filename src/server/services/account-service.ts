/**
 * server/services/account-service.ts
 *
 * Orchestration between route handlers and the account repository.
 * - Accepts verified userId from route layer.
 * - No direct DB access — all persistence via repository.
 * - No Hono / ctx references.
 */

import {
  listAccounts,
  getAccountById,
  insertAccount,
  updateAccount,
  deleteAccount,
  deleteManyAccounts,
} from "@/src/server/repositories/account-repository";
import { balanceService } from "@/src/server/services/balance-service";

import type { insertAccountSchema } from "@/src/db/schema";
import type { z } from "zod";

type NameValues = Pick<z.infer<typeof insertAccountSchema>, "name">;

// ── Read ──────────────────────────────────────────────────────────────────────
//
// `balance` is always the live, single-source-of-truth figure from
// balance-service (openingBalance + all-time transaction sum) — never a
// stored/stale field. Every consumer (Accounts, Dashboard, Transactions)
// gets it from here so the number can never disagree across screens.

export async function getAccounts(userId: string) {
  const [rows, balances] = await Promise.all([
    listAccounts(userId),
    balanceService.getBalancesForUser(userId),
  ]);

  return rows.map((row) => ({
    ...row,
    balance: balances.get(row.id) ?? row.openingBalance,
  }));
}

export async function getAccount(id: string, userId: string) {
  const [row, balance] = await Promise.all([
    getAccountById(id, userId),
    balanceService.getBalanceForAccount(id, userId),
  ]);

  if (!row) return null;
  // balance is only null when ownership fails, which getAccountById already
  // guards against above (same id+userId scope) — so this is unreachable in
  // practice, but 0 is a safe fallback rather than throwing.
  return { ...row, balance: balance ?? 0 };
}

// ── Write ─────────────────────────────────────────────────────────────────────

export const createAccount = (userId: string, values: NameValues)     => insertAccount(userId, values);
export const editAccount   = (id: string, userId: string, v: NameValues) => updateAccount(id, userId, v);
export const removeAccount = (id: string, userId: string)             => deleteAccount(id, userId);
export const removeManyAccounts = (ids: string[], userId: string)     => deleteManyAccounts(ids, userId);