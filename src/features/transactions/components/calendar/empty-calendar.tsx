export function EmptyCalendar() {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">No transactions this month.</p>
    </div>
  )
}

export function CalendarError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">Unable to load calendar. Pull to refresh or try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[var(--radius-pill)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-ring"
      >
        Retry
      </button>
    </div>
  )
}