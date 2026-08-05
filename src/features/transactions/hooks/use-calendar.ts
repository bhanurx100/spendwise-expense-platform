"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { addMonths } from "../utils/calendar-utils"
import { useMonthAggregation } from "./use-month-aggregation"

export function useCalendar(initialMonth?: string) {
  const now = new Date()
  const [year, setYear] = useState(() => (initialMonth ? Number(initialMonth.split("-")[0]) : now.getFullYear()))
  const [monthIndex, setMonthIndex] = useState(() => (initialMonth ? Number(initialMonth.split("-")[1]) - 1 : now.getMonth()))
  const router = useRouter()

  const { cells, monthTotals, isLoading, isError, refetch } = useMonthAggregation(year, monthIndex)

  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth()

  // This is a personal-finance ledger, not an events calendar — there is
  // no legitimate reason to browse forward into a month that cannot yet
  // contain any transactions. Without this guard the "next month" arrow
  // browses forever into empty months (Phase 1.3, Part 8).
  const canGoToNextMonth = !isCurrentMonth && (
    year < now.getFullYear() || (year === now.getFullYear() && monthIndex < now.getMonth())
  )

  const goToPreviousMonth = useCallback(() => {
    const next = addMonths(year, monthIndex, -1)
    setYear(next.year)
    setMonthIndex(next.monthIndex)
  }, [year, monthIndex])

  const goToNextMonth = useCallback(() => {
    if (!canGoToNextMonth) return
    const next = addMonths(year, monthIndex, 1)
    setYear(next.year)
    setMonthIndex(next.monthIndex)
  }, [year, monthIndex, canGoToNextMonth])

  const goToToday = useCallback(() => {
    setYear(now.getFullYear())
    setMonthIndex(now.getMonth())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectDay = useCallback(
    (dateKey: string) => {
      router.push(`/transactions/day/${dateKey}`)
    },
    [router],
  )

  return {
    year,
    monthIndex,
    isCurrentMonth,
    canGoToNextMonth,
    cells,
    monthTotals,
    isLoading,
    isError,
    refetch,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDay,
  }
}