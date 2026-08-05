/**
 * features/transactions/api/transaction-mutations.ts
 *
 * Centralized mutation functions and cache invalidation helpers
 * for the transactions feature.
 *
 * Hooks import these to stay thin.
 * Invalidation logic lives in ONE place so it's always consistent.
 *
 * Pattern:
 *   const mutation = useMutation(createTransactionMutation(queryClient));
 */

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions,
  bulkDeleteTransactions,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type BulkCreateInput,
  type BulkDeleteInput,
} from "./transactions-api";
import { transactionKeys, summaryKeys } from "./query-keys";
import { accountKeys } from "@/src/features/accounts/api/query-keys";

// ─── Shared invalidation helper ────────────────────────────────────────────────

/**
 * Invalidate all caches that a write operation affects.
 * Always invalidates: transaction list + summary + accounts (balances are
 * derived from transactions, so any write can change every account's
 * displayed balance).
 * Optionally invalidates: specific transaction detail (when id provided).
 */
export async function invalidateAfterWrite(
  queryClient: QueryClient,
  id?: string
): Promise<void> {
  const targets = [
    transactionKeys.all,
    summaryKeys.all,
    accountKeys.all,
    ...(id ? [transactionKeys.detail(id)] : []),
  ];

  await Promise.all(
    targets.map((key) =>
      queryClient.invalidateQueries({ queryKey: key })
    )
  );
}

// ─── Mutation option factories ─────────────────────────────────────────────────

/**
 * Mutation options for creating a transaction.
 *
 * Usage:
 *   const mutation = useMutation(createTransactionMutation(queryClient));
 */
export function createTransactionMutation(queryClient: QueryClient) {
  return {
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: async () => {
      toast.success("Transaction created.");
      await invalidateAfterWrite(queryClient);
    },
    onError: () => {
      toast.error("Failed to create transaction.");
    },
  } as const;
}

/**
 * Mutation options for updating a transaction.
 */
export function updateTransactionMutation(
  queryClient: QueryClient,
  id: string | undefined
) {
  return {
    mutationFn: (input: UpdateTransactionInput) =>
      updateTransaction(id!, input),
    onSuccess: async () => {
      toast.success("Transaction updated.");
      await invalidateAfterWrite(queryClient, id);
    },
    onError: () => {
      toast.error("Failed to edit transaction.");
    },
  } as const;
}

/**
 * Mutation options for deleting a single transaction.
 */
export function deleteTransactionMutation(
  queryClient: QueryClient,
  id: string | undefined
) {
  return {
    mutationFn: () => deleteTransaction(id!),
    onSuccess: async () => {
      toast.success("Transaction deleted.");
      await invalidateAfterWrite(queryClient, id);
    },
    onError: () => {
      toast.error("Failed to delete transaction.");
    },
  } as const;
}

/**
 * Mutation options for bulk-creating transactions (CSV import).
 */
export function bulkCreateTransactionsMutation(queryClient: QueryClient) {
  return {
    mutationFn: (input: BulkCreateInput) => bulkCreateTransactions(input),
    onSuccess: async () => {
      toast.success("Transaction(s) created.");
      await invalidateAfterWrite(queryClient);
    },
    onError: () => {
      toast.error("Failed to create transaction(s).");
    },
  } as const;
}

/**
 * Mutation options for bulk-deleting transactions.
 */
export function bulkDeleteTransactionsMutation(queryClient: QueryClient) {
  return {
    mutationFn: (input: BulkDeleteInput) => bulkDeleteTransactions(input),
    onSuccess: async () => {
      toast.success("Transaction(s) deleted.");
      await invalidateAfterWrite(queryClient);
    },
    onError: () => {
      toast.error("Failed to delete transaction(s).");
    },
  } as const;
}