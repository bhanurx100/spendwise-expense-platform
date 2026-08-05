"use client"

import { Suspense } from "react"
import { EmptyCalendar, CalendarError } from "@/src/features/transactions/components/calendar/empty-calendar"
import { CalendarGrid } from "@/src/features/transactions/components/calendar/calendar-grid"
import { CalendarHeader } from "@/src/features/transactions/components/calendar/calendar-header"
import { CalendarLegend } from "@/src/features/transactions/components/calendar/calendar-legend"
import { LoadingCalendar } from "@/src/features/transactions/components/calendar/loading-calendar"
import { MonthSummary } from "@/src/features/transactions/components/calendar/month-summary"
import { useCalendar } from "@/src/features/transactions/hooks/use-calendar"
import { GlassCard } from "@/src/shared/components/glass-card"
import { GlassWorkspace } from "@/src/shared/components/glass-workspace"
import { useRouter, useSearchParams } from "next/navigation"

const CURRENCY = "INR" as const

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMonth = searchParams.get("month") ?? undefined

  const {
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
  } = useCalendar(initialMonth)

  const hasAnyActivity = cells.some((c) => c.inCurrentMonth && c.hasActivity)

  const handleClose = () => {
    router.back()
  }

  const actions = (
    <CalendarHeader
      year={year}
      monthIndex={monthIndex}
      isCurrentMonth={isCurrentMonth}
      canGoToNextMonth={canGoToNextMonth}
      onPrevious={goToPreviousMonth}
      onNext={goToNextMonth}
      onToday={goToToday}
    />
  )

  return (
    <GlassWorkspace isOpen={true} onClose={handleClose} title="Cash Flow Calendar" actions={actions}>
      {isLoading ? (
        <LoadingCalendar />
      ) : isError ? (
        <CalendarError onRetry={refetch} />
      ) : (
        <>
          <MonthSummary totals={monthTotals} currency={CURRENCY} />
          <GlassCard radius="cardLg" padding="md">
            <CalendarGrid cells={cells} selectedDate={null} onSelectDay={selectDay} />
          </GlassCard>
          {!hasAnyActivity && <EmptyCalendar />}
          <CalendarLegend />
        </>
      )}
    </GlassWorkspace>
  )
}

export default function CashFlowCalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" aria-hidden="true" />
      </div>
    }>
      <CalendarContent />
    </Suspense>
  )
}