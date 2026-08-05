import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { transactionListQuery } from "./transaction-queries";
import type { TransactionListFilters } from "./query-keys";

/**
 * Reads filters from the URL by default (unchanged behavior). Pass
 * `overrides` to use an explicit filter set instead — e.g. a period
 * selector (1M/3M/6M/1Y/All) that isn't reflected in the URL. Overrides
 * take precedence field-by-field over the URL values.
 */
export const useGetTransactions = (overrides?: Partial<TransactionListFilters>) => {
  const searchParams = useSearchParams();

  const filters = {
    from:      overrides?.from      ?? searchParams.get("from")      ?? "",
    to:        overrides?.to        ?? searchParams.get("to")        ?? "",
    accountId: overrides?.accountId ?? searchParams.get("accountId") ?? "",
  };

  return useQuery(transactionListQuery(filters));
};