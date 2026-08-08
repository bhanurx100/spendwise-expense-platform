/**
 * features/transactions/api/transactions-api.ts
 *
 * Pure API communication layer for the transactions feature.
 * NO React, NO hooks, NO UI logic, NO business logic.
 *
 * Only responsibilities:
 *  - Call the Hono client
 *  - Map request/response shapes
 *  - Convert amount units (milliunits ↔ plain decimals)
 *
 * All functions return plain Promises — no TanStack Query involvement here.
 * This makes them independently testable and reusable in server actions later.
 */

import { client } from "@/src/lib/hono";
import { convertAmountFromMilliunits } from "@/src/lib/utils";
import type { TransactionListFilters } from "./query-keys";

// ─── Response types (inferred from Hono client) ────────────────────────────────

import type { InferRequestType, InferResponseType } from "hono";

export type TransactionListItem = InferResponseType<
  typeof client.api.transactions.$get,
  200
>["data"][0] & { amount: number }; // amount is converted from milliunits

export type TransactionDetail = InferResponseType<
  (typeof client.api.transactions)[":id"]["$get"],
  200
>["data"] & { amount: number };

export type CreateTransactionInput = InferRequestType<
  typeof client.api.transactions.$post
>["json"];

export type UpdateTransactionInput = InferRequestType<
  (typeof client.api.transactions)[":id"]["$patch"]
>["json"];

export type BulkCreateInput = InferRequestType<
  (typeof client.api.transactions)["bulk-create"]["$post"]
>["json"];

export type BulkDeleteInput = InferRequestType<
  (typeof client.api.transactions)["bulk-delete"]["$post"]
>["json"];

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch a paginated/filtered list of transactions.
 * Converts all amount values from milliunits to plain decimals.
 */
export async function getTransactions(
  filters: TransactionListFilters = {}
): Promise<TransactionListItem[]> {
  const response = await client.api.transactions.$get({
    query: {
      from: filters.from ?? "",
      to: filters.to ?? "",
      accountId: filters.accountId ?? "",
    },
  });

  if (!response.ok) {
    console.error("[TRANSACTIONS] fetch failed status=", response.status);
    throw new Error(`Failed to fetch transactions (${response.status}).`);
  }

  const { data } = await response.json();
  if (!Array.isArray(data)) {
    console.error("[TRANSACTIONS] response data is not an array");
    throw new Error("Failed to fetch transactions.");
  }

  return data.map((tx) => ({
    ...tx,
    amount: convertAmountFromMilliunits(tx.amount),
  }));
}

/**
 * Fetch a single transaction by ID.
 * Converts amount from milliunits to plain decimals.
 */
export async function getTransaction(id: string): Promise<TransactionDetail> {
  const response = await client.api.transactions[":id"].$get({
    param: { id },
  });

  if (!response.ok) throw new Error("Failed to fetch transaction.");

  const { data } = await response.json();

  return {
    ...data,
    amount: convertAmountFromMilliunits(data.amount),
  };
}

/**
 * Create a single transaction.
 * Amount in the input should already be in milliunits (handled by the form).
 */
export async function createTransaction(input: CreateTransactionInput) {
  const response = await client.api.transactions.$post({ json: input });
  const result = await response.json();
  return result;
}

/**
 * Update (patch) a transaction by ID.
 */
export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput
) {
  const response = await client.api.transactions[":id"]["$patch"]({
    json: input,
    param: { id },
  });
  const result = await response.json();
  return result;
}

/**
 * Delete a single transaction by ID.
 */
export async function deleteTransaction(id: string) {
  const response = await client.api.transactions[":id"]["$delete"]({
    param: { id },
  });
  const result = await response.json();
  return result;
}

/**
 * Bulk-create transactions (CSV import flow).
 */
export async function bulkCreateTransactions(input: BulkCreateInput) {
  const response = await client.api.transactions["bulk-create"]["$post"]({
    json: input,
  });
  const result = await response.json();
  return result;
}

/**
 * Bulk-delete transactions by IDs.
 */
export async function bulkDeleteTransactions(input: BulkDeleteInput) {
  const response = await client.api.transactions["bulk-delete"]["$post"]({
    json: input,
  });
  const result = await response.json();
  return result;
}