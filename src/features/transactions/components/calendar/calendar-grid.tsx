"use client"

import { cn } from "@/src/lib/utils"
import { useRef } from "react"
import { WEEKDAY_LABELS, type DayAggregate } from "../../utils/calendar-utils"

function DayCell({
    cell,
    selected,
    tabIndex,
    index,
    onSelect,
    cellRef,
    onKeyDown,
}: {
    cell: DayAggregate
    selected: boolean
    tabIndex: number
    index: number
    onSelect: (dateKey: string) => void
    cellRef: (el: HTMLButtonElement | null) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => void
}) {
    const netAbs = Math.abs(cell.netAmount)
    const netLabel = netAbs >= 1000 ? `${Math.round(netAbs / 100) / 10}k` : netAbs.toLocaleString("en-IN")

    return (
        <button
            ref={cellRef}
            type="button"
            tabIndex={cell.inCurrentMonth ? tabIndex : -1}
            disabled={!cell.inCurrentMonth}
            onClick={() => onSelect(cell.dateKey)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[var(--radius-tile)] py-2 transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                !cell.inCurrentMonth && "pointer-events-none opacity-30",
                selected && "bg-[var(--primary)]",
            )}
            style={{ minHeight: 44, minWidth: 44 }}
            aria-label={`${cell.dateKey}${cell.hasActivity
                    ? `, net ${cell.netAmount >= 0 ? "positive" : "negative"} ₹${netAbs.toLocaleString("en-IN")}, ${cell.transactionCount} transaction${cell.transactionCount === 1 ? "" : "s"}`
                    : ", no activity"
                }`}
            aria-current={cell.isToday ? "date" : undefined}
        >
            <span
                className={cn(
                    "flex size-6 items-center justify-center rounded-full text-sm font-semibold",
                    selected ? "text-white" : cell.isToday ? "bg-[var(--primary)] text-white" : "text-[var(--foreground)]",
                )}
            >
                {cell.day}
            </span>
            {cell.hasActivity ? (
                <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: selected ? "white" : cell.netAmount >= 0 ? "var(--positive)" : "var(--destructive)" }}
                >
                    {cell.netAmount >= 0 ? "+" : "-"}
                    {netLabel}
                </span>
            ) : (
                <span className="size-1 rounded-full" style={{ background: selected ? "white" : "var(--muted-foreground)" }} />
            )}
        </button>
    )
}

export function CalendarGrid({
    cells,
    selectedDate,
    onSelectDay,
}: {
    cells: DayAggregate[]
    selectedDate: string | null
    onSelectDay: (dateKey: string) => void
}) {
    const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

    function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
        const deltas: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: 7,
            ArrowUp: -7,
        }
        const delta = deltas[e.key]
        if (delta === undefined) return
        e.preventDefault()
        const targetIndex = index + delta
        const target = buttonRefs.current.get(targetIndex)
        target?.focus()
    }

    return (
        <div className="flex flex-col gap-2" role="grid" aria-label="Calendar">
            <div className="grid grid-cols-7 text-center text-xs font-medium text-[var(--muted-foreground)]" role="row">
                {WEEKDAY_LABELS.map((d, i) => (
                    <span key={i} role="columnheader">
                        {d}
                    </span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1" role="rowgroup">
                {cells.map((cell, i) => (
                    <DayCell
                        key={cell.dateKey}
                        cell={cell}
                        selected={cell.dateKey === selectedDate}
                        tabIndex={cell.dateKey === selectedDate || (!selectedDate && cell.isToday) ? 0 : -1}
                        index={i}
                        onSelect={onSelectDay}
                        cellRef={(el) => {
                            if (el) buttonRefs.current.set(i, el)
                        }}
                        onKeyDown={handleKeyDown}
                    />
                ))}
            </div>
        </div>
    )
}