"use client"

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { transactionListQuery } from '@/src/features/transactions/api/transaction-queries'
import { mapTransactionRow } from '@/src/features/transactions/lib/map-transaction'

export function useDayTransactions(dateKey: string) {
  const query = useQuery(transactionListQuery({ from: dateKey, to: dateKey }))

  // Filter transactions to the selected day
  const dayTransactions = useMemo(() => {
    return (query.data ?? []).map(mapTransactionRow).filter((tx) => tx.isoDate === dateKey)
  }, [dateKey, query.data])

  // Sort by time (latest first)
  const sorted = useMemo(
    () => [...dayTransactions].sort((a, b) => (b.time ?? "").localeCompare(a.time ?? "")),
    [dayTransactions],
  )

  return { transactions: sorted, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch }
}
