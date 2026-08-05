"use client"

import { TransactionTimeline } from "@/src/features/transactions/sections/transaction-timeline"
import type { Transaction, Currency } from "@/src/types/transaction"

export function DayTransactionList({ transactions }: { transactions: Transaction[] }) {
  // Group transactions by day for the timeline component
  const groups = [
    {
      id: 'day',
      month: transactions[0]?.date || '',
      year: new Date().getFullYear(),
      totalSpent: transactions.reduce((sum, tx) => sum + (tx.type === 'expense' ? tx.amount : 0), 0),
      currency: 'INR' as Currency,
      transactions,
    },
  ]

  return <TransactionTimeline groups={groups} activeType="all" />
}