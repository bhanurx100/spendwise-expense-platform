function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] ${className ?? ""}`} />
}

export function LoadingCalendar() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading calendar">
      <Pulse className="h-16 rounded-[var(--radius)]" />
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Pulse key={i} className="h-3" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Pulse key={i} className="h-11" />
          ))}
        </div>
      </div>
    </div>
  )
}