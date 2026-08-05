export interface DayAggregate {
  dateKey: string // "yyyy-mm-dd"
  day: number
  inCurrentMonth: boolean
  isToday: boolean
  netAmount: number
  incomeAmount: number
  expenseAmount: number
  transactionCount: number
  hasActivity: boolean
}

export interface DayAggregateInput {
  netAmount: number
  incomeAmount: number
  expenseAmount: number
  transactionCount: number
}

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function addMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const d = new Date(year, monthIndex + delta, 1)
  return { year: d.getFullYear(), monthIndex: d.getMonth() }
}

export function isSameMonth(year: number, monthIndex: number, date: Date): boolean {
  return date.getFullYear() === year && date.getMonth() === monthIndex
}

/** Inclusive [from, to] ISO date bounds for the given calendar month — used
 *  as the query range so the underlying data hook only ever fetches/aggregates
 *  one month at a time, never the user's full history. */
export function getMonthRange(year: number, monthIndex: number): { from: string; to: string } {
  const from = toDateKey(new Date(year, monthIndex, 1))
  const to = toDateKey(new Date(year, monthIndex + 1, 0))
  return { from, to }
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function formatDayHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
}

/**
 * Buckets a flat list of Transaction records into per-day totals.
 * Pure and side-effect free — callers decide where the input list
 * comes from (a server aggregate endpoint, or a already-fetched month of
 * transactions); this function does not fetch anything itself.
 */
export function aggregateTransactionsByDate<T extends { isoDate: string; amount: number; type: "income" | "expense" | "refund" | "transfer" }>(
  transactions: T[],
): Map<string, DayAggregateInput> {
  const map = new Map<string, DayAggregateInput>()
  for (const txn of transactions) {
    const entry = map.get(txn.isoDate) ?? { netAmount: 0, incomeAmount: 0, expenseAmount: 0, transactionCount: 0 }
    if (txn.type === "income" || txn.type === "refund") {
      entry.incomeAmount += txn.amount
      entry.netAmount += txn.amount
    } else {
      // expense and transfer both reduce net
      entry.expenseAmount += txn.amount
      entry.netAmount -= txn.amount
    }
    entry.transactionCount += 1
    map.set(txn.isoDate, entry)
  }
  return map
}

/**
 * Builds a Sun-start calendar grid for the given month, sized to however
 * many weeks that month needs (5 or 6) — never a fixed row count. Leading/
 * trailing cells from adjacent months are included (inCurrentMonth: false)
 * so the grid stays a full 7-wide rectangle; they carry no aggregate data
 * since they belong to a different query range.
 */
export function buildMonthGrid(year: number, monthIndex: number, aggregatesByDate: Map<string, DayAggregateInput>): DayAggregate[] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingCount = firstOfMonth.getDay()
  const totalCells = Math.ceil((leadingCount + daysInMonth) / 7) * 7

  const today = new Date()
  const todayKey = toDateKey(today)

  const cells: DayAggregate[] = []
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, monthIndex, 1 - leadingCount + i)
    const dateKey = toDateKey(date)
    
    // Skip dates in the future
    if (date > today) continue
    
    const inCurrentMonth = date.getMonth() === monthIndex
    const agg = inCurrentMonth ? aggregatesByDate.get(dateKey) : undefined
    cells.push({
      dateKey,
      day: date.getDate(),
      inCurrentMonth,
      isToday: dateKey === todayKey,
      netAmount: agg?.netAmount ?? 0,
      incomeAmount: agg?.incomeAmount ?? 0,
      expenseAmount: agg?.expenseAmount ?? 0,
      transactionCount: agg?.transactionCount ?? 0,
      hasActivity: !!agg,
    })
  }
  return cells
}