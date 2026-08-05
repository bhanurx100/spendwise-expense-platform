"use client"

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buildMonthGrid, getMonthRange, type DayAggregate, type DayAggregateInput } from "../utils/calendar-utils"
import { summaryQuery } from '@/src/features/summary/api/summary-queries'

export interface MonthTotals {
  incomeAmount: number
  expenseAmount: number
  netAmount: number
  transactionCount: number
}

/**
 * The Calendar used to fetch the raw transaction list for the month and
 * aggregate it itself (`aggregateTransactionsByDate`), completely separate
 * from the summary endpoint that powers the Overview's Cash Flow card.
 * Two independent aggregation paths over the same underlying transactions
 * is exactly the "every page calculates its own numbers" bug: the two
 * were liable to disagree (and did — see summary-repository.ts's
 * `getDailyTotals` fix), and any future change to how income/expense is
 * classified would need to be made in two places to stay consistent.
 *
 * Fix: the Calendar now asks for the same canonical per-day totals
 * (`summaryQuery`, backed by summaryService → summaryRepository) that
 * every other screen uses. It builds its grid directly from those
 * server-aggregated `days` rows instead of re-deriving anything from a
 * transaction list on the client.
 */
export function useMonthAggregation(year: number, monthIndex: number) {
  const { from, to } = useMemo(() => getMonthRange(year, monthIndex), [year, monthIndex])

  const query = useQuery(summaryQuery({ from, to }))

  // `SummaryDay.date` is an ISO string whose date component already
  // represents the intended calendar day (summary-service builds it from
  // the same `from`/`to` this hook requested) — slice it directly rather
  // than re-parsing through `new Date(...).getFullYear()` etc., which
  // would reintroduce a timezone-dependent reinterpretation of a value
  // that's already unambiguous as a string.
  const aggregatesByDate = useMemo(() => {
    const map = new Map<string, DayAggregateInput>()
    for (const day of query.data?.days ?? []) {
      map.set(day.date.slice(0, 10), {
        netAmount: day.income - day.expenses,
        incomeAmount: day.income,
        expenseAmount: day.expenses,
        transactionCount: day.transactionCount,
      })
    }
    return map
  }, [query.data])

  const cells: DayAggregate[] = useMemo(
    () => buildMonthGrid(year, monthIndex, aggregatesByDate),
    [year, monthIndex, aggregatesByDate],
  )

  const monthTotals: MonthTotals = useMemo(() => {
    let income = 0
    let expense = 0
    let count = 0
    for (const cell of cells) {
      if (!cell.inCurrentMonth) continue
      income += cell.incomeAmount
      expense += cell.expenseAmount
      count += cell.transactionCount
    }
    return { incomeAmount: income, expenseAmount: expense, netAmount: income - expense, transactionCount: count }
  }, [cells])

  return { cells, monthTotals, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch }
}
