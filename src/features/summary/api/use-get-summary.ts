/**
 * features/summary/api/use-get-summary.ts
 *
 * Thin hook — reads URL search params, delegates to summaryQuery().
 *
 * Before: contained hono call, milliunit conversion, inline query key.
 * After:  reads params + calls useQuery(summaryQuery(filters)).
 *
 * Drop-in replacement — response shape is identical.
 */

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { summaryQuery } from "./summary-queries";
import type { SummaryFilters } from "./query-keys";

/**
 * Reads filters from the URL by default (unchanged behavior). Pass
 * `overrides` to use an explicit filter set instead — e.g. a period
 * selector that isn't reflected in the URL. Overrides take precedence
 * field-by-field over the URL values.
 */
export const useGetSummary = (overrides?: Partial<SummaryFilters>) => {
  const searchParams = useSearchParams();

  const filters = {
    from:      overrides?.from      ?? searchParams.get("from")      ?? "",
    to:        overrides?.to        ?? searchParams.get("to")        ?? "",
    accountId: overrides?.accountId ?? searchParams.get("accountId") ?? "",
  };

  return useQuery(summaryQuery(filters));
};