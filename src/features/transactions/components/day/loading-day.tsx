function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] ${className ?? ""}`} />
}

export function LoadingDay() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading transactions">
      <Pulse className="h-16 rounded-[var(--radius)]" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-2">
          <Pulse className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Pulse className="h-3 w-1/2" />
            <Pulse className="h-2.5 w-1/3" />
          </div>
          <Pulse className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}