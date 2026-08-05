export function EmptyDay() {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">No transactions on this day.</p>
    </div>
  )
}

export function DayError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">Unable to load transactions. Pull to refresh or try again.</p>
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