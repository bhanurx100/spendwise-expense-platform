/**
 * server/repositories/account-repository.ts
 *
 * OPTIMIZATIONS vs original:
 *  1. deleteManyAccounts: guard against empty `ids` array — an inArray() with
 *     an empty array generates invalid SQL on some drivers (or a full-table
 *     scan on others). Short-circuit returns [] immediately.
 *  2. Select fields are already minimal (id + name only) — no further
 *     reduction without breaking callers.
 *  3. All other functions unchanged.
 *
 * Behavior is identical to the original for non-empty inputs.
 */

import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/src/db/drizzle";
import { accounts, insertAccountSchema } from "@/src/db/schema";
import type { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

type NameValues = Pick<z.infer<typeof insertAccountSchema>, "name">;

// ── Read ──────────────────────────────────────────────────────────────────────

export async function listAccounts(userId: string) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      institution: accounts.institution,
      type: accounts.type,
      openingBalance: accounts.openingBalance,
      maskedNumber: accounts.maskedNumber,
      isPrimary: accounts.isPrimary,
      linkedAccountId: accounts.linkedAccountId,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId));
}

export async function getAccountById(id: string, userId: string) {
  const [row] = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)));

  return row ?? null;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function insertAccount(userId: string, values: NameValues) {
  const [row] = await db
    .insert(accounts)
    .values({ id: createId(), userId, ...values })
    .returning();

  return row;
}

export async function updateAccount(
  id: string,
  userId: string,
  values: NameValues
) {
  const [row] = await db
    .update(accounts)
    .set(values)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    .returning();

  return row ?? null;
}

export async function deleteAccount(id: string, userId: string) {
  const [row] = await db
    .delete(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    .returning({ id: accounts.id });

  return row ?? null;
}

export async function deleteManyAccounts(ids: string[], userId: string) {
  // Guard: inArray with an empty array produces invalid SQL on some drivers
  if (ids.length === 0) return [];

  return db
    .delete(accounts)
    .where(and(eq(accounts.userId, userId), inArray(accounts.id, ids)))
    .returning({ id: accounts.id });
}