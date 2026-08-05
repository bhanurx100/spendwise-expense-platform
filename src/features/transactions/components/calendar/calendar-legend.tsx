export function CalendarLegend() {
  return (
    <div className="flex items-center justify-center gap-5 text-xs text-[var(--muted-foreground)]">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: "var(--positive)" }} aria-hidden="true" />
        Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: "var(--destructive)" }} aria-hidden="true" />
        Expense
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: "var(--muted-foreground)" }} aria-hidden="true" />
        No Activity
      </span>
    </div>
  )
}