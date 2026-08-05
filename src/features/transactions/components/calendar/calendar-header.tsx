"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { monthLabel } from "../../utils/calendar-utils"

export function CalendarHeader({
  year,
  monthIndex,
  isCurrentMonth,
  canGoToNextMonth = true,
  onPrevious,
  onNext,
  onToday,
}: {
  year: number
  monthIndex: number
  isCurrentMonth: boolean
  canGoToNextMonth?: boolean
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Previous month"
          className="flex size-9 items-center justify-center rounded-[var(--radius-tile)] border border-[var(--border)] transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
        <span className="min-w-[9.5rem] text-center text-base font-bold text-[var(--foreground)]" aria-live="polite">
          {monthLabel(year, monthIndex)}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoToNextMonth}
          aria-label="Next month"
          aria-disabled={!canGoToNextMonth}
          className="flex size-9 items-center justify-center rounded-[var(--radius-tile)] border border-[var(--border)] transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={onToday}
          className="rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          Today
        </button>
      )}
    </div>
  )
}