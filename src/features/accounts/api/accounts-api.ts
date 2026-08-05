/**
 * features/accounts/api/accounts-api.ts
 *
 * Pure API communication layer for accounts.
 * NO React, NO hooks, NO business logic.
 * Only: hono client calls + response unwrapping.
 */

import { client } from "@/src/lib/hono";
import { convertAmountFromMilliunits } from "@/src/lib/utils";
import type { InferRequestType, InferResponseType } from "hono";

/**
 * ROOT-CAUSE FIX (Phase 1.3, Part 3/4 — unit consistency):
 *
 * The accounts API route/service never converted milliunits → decimal
 * (unlike summary-api.ts, which always did). Every frontend consumer of
 * `account.balance` / `account.openingBalance` was therefore reading a
 * raw milliunit integer, ~1000x too large — this is the exact cause of
 * the "crore" balances on the Accounts page and the mismatched Net Worth
 * card on the Dashboard (whose other figures DO go through
 * convertAmountFromMilliunits via summary-api.ts).
 *
 * Fix: convert once, here, at the API boundary — the same place
 * summary-api.ts already does it — so every component downstream
 * (account-carousel, accounts-headline, distribution-card,
 * portfolio-summary, use-financial-view, account-manager-modal, …)
 * receives an already-correct decimal value and none of them needs to
 * know about milliunits at all.
 */
function toDecimalAccount(row: any): any {
  return {
    ...row,
    balance: convertAmountFromMilliunits(row.balance),
    openingBalance: convertAmountFromMilliunits(row.openingBalance),
  };
}

// ─── Response types ────────────────────────────────────────────────────────────

export type AccountListItem = InferResponseType<
  typeof client.api.accounts.$get,
  200
>["data"][0];

export type AccountDetail = InferResponseType<
  (typeof client.api.accounts)[":id"]["$get"],
  200
>["data"];

export type CreateAccountInput = InferRequestType<
  typeof client.api.accounts.$post
>["json"];

export type UpdateAccountInput = InferRequestType<
  (typeof client.api.accounts)[":id"]["$patch"]
>["json"];

export type BulkDeleteAccountsInput = InferRequestType<
  (typeof client.api.accounts)["bulk-delete"]["$post"]
>["json"];

// ─── API functions ─────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<AccountListItem[]> {
  const response = await client.api.accounts.$get();
  if (!response.ok) throw new Error("Failed to fetch accounts.");
  const { data } = await response.json();
  return data.map(toDecimalAccount);
}

export async function getAccount(id: string): Promise<AccountDetail> {
  const response = await client.api.accounts[":id"].$get({ param: { id } });
  if (!response.ok) throw new Error("Failed to fetch account.");
  const { data } = await response.json();
  return toDecimalAccount(data);
}

export async function createAccount(input: CreateAccountInput) {
  const response = await client.api.accounts.$post({ json: input });
  return response.json();
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  const response = await client.api.accounts[":id"]["$patch"]({
    json: input,
    param: { id },
  });
  return response.json();
}

export async function deleteAccount(id: string) {
  const response = await client.api.accounts[":id"]["$delete"]({ param: { id } });
  return response.json();
}

export async function bulkDeleteAccounts(input: BulkDeleteAccountsInput) {
  const response = await client.api.accounts["bulk-delete"]["$post"]({ json: input });
  return response.json();
}