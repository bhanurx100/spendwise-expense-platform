"use client"

import { GlassCard, GlassCardDivider } from "@/src/shared/components/glass-card"
import { GlassSegment } from "@/src/shared/components/glass-segment"
import { formatCurrency } from "@/src/shared/lib/format"
import type { CashFlowPeriod, CashFlowPoint, Currency } from "@/src/types/transaction"
import { CalendarDays, ChevronRight, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState, memo } from "react"
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const periods: CashFlowPeriod[] = ["1M", "3M", "6M", "1Y"]
const periodCap: Record<CashFlowPeriod, number> = { "1M": 5000, "3M": 5000, "6M": 5000, "1Y": 5000 }

function FlowTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ payload?: { inflowRaw?: number; outflowRaw?: number } }>
  label?: string
  currency: Currency
}) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload as { inflowRaw?: number; outflowRaw?: number } | undefined
  const inflow = Math.abs(datum?.inflowRaw ?? 0)
  const outflow = Math.abs(datum?.outflowRaw ?? 0)
  return (
    <div className="min-w-36 rounded-2xl border border-[var(--border)] bg-[var(--popover)] px-3.5 py-2.5 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--popover-foreground)]">{label}</p>
      <div className="mt-1.5 flex flex-col gap-1">
        <p className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <span className="size-1.5 rounded-full bg-[var(--primary)]" aria-hidden /> Income
          </span>
          <span className="font-bold tabular-nums text-[var(--popover-foreground)]">{formatCurrency(inflow, currency)}</span>
        </p>
        <p className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <span className="size-1.5 rounded-full bg-[var(--muted-foreground)]" aria-hidden /> Expense
          </span>
          <span className="font-bold tabular-nums text-[var(--popover-foreground)]">{formatCurrency(outflow, currency)}</span>
        </p>
      </div>
    </div>
  )
}

export const CashFlowCard = memo(function CashFlowCard({
  seriesByPeriod,
  currency,
}: {
  seriesByPeriod: Record<CashFlowPeriod, CashFlowPoint[]>
  currency: Currency
}) {
  const [period, setPeriod] = useState<CashFlowPeriod>("1M")
  const router = useRouter()

  const cap = periodCap[period]
  const rawSeries = useMemo(() => seriesByPeriod[period] ?? [], [seriesByPeriod, period])

  const chartData = useMemo(
    () =>
      rawSeries.map((d) => ({
        label: d.label,
        dateKey: d.dateKey,
        inflow: Math.min(d.inflow, cap),
        outflow: -Math.min(Math.abs(d.outflow), cap),
        outflowAbs: Math.min(Math.abs(d.outflow), cap),
        inflowRaw: d.inflow,
        outflowRaw: Math.abs(d.outflow),
      })),
    [rawSeries, cap],
  )

  const { incomeTotal, expenseTotal } = useMemo(
    () =>
      rawSeries.reduce(
        (acc, d) => {
          acc.incomeTotal += d.inflow
          acc.expenseTotal += Math.abs(d.outflow)
          return acc
        },
        { incomeTotal: 0, expenseTotal: 0 },
      ),
    [rawSeries],
  )

  const netTotal = incomeTotal - expenseTotal
  const maxAbs = useMemo(() => Math.max(...chartData.map((d) => Math.max(d.inflow, d.outflowAbs)), 1), [chartData])
  const tickInterval = chartData.length > 14 ? Math.ceil(chartData.length / 7) - 1 : "preserveStartEnd"

  const navigateToPoint = useCallback(
    (dateKey?: string) => {
      if (!dateKey) return router.push("/transactions")
      router.push(dateKey.length === 7 ? `/transactions?month=${dateKey}` : `/transactions?date=${dateKey}`)
    },
    [router],
  )

  return (
    <GlassCard radius="cardLg" padding="lg" spotlight className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Cash Flow</h2>
          <Info className="size-3.5 text-[var(--muted-foreground)]" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/transactions"
            className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
          >
            <CalendarDays className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            View
            <ChevronRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <GlassSegment
            layoutId="cashflow-period"
            value={period}
            onChange={(v) => setPeriod(v as CashFlowPeriod)}
            fullWidth={false}
            options={periods.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          No transactions yet. Add your first expense to start tracking.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-5">
            <Link href={`/transactions?type=income&period=${period}`} className="group flex min-w-0 flex-col gap-0.5 focus-visible:outline-2 focus-visible:outline-ring">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                <span className="size-2 rounded-full bg-[var(--primary)]" aria-hidden /> Income
              </span>
              <span className="truncate text-base font-bold leading-tight text-[var(--primary)] sm:text-lg">
                {formatCurrency(incomeTotal, currency)}
              </span>
            </Link>
            <Link href={`/transactions?type=expense&period=${period}`} className="group flex min-w-0 flex-col gap-0.5 focus-visible:outline-2 focus-visible:outline-ring">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                <span className="size-2 rounded-full bg-[var(--muted-foreground)]" aria-hidden /> Expense
              </span>
              <span className="truncate text-base font-bold leading-tight text-[var(--muted-foreground)] sm:text-lg">
                {formatCurrency(expenseTotal, currency)}
              </span>
            </Link>
            <div className="ml-auto flex min-w-0 flex-col items-end gap-0.5">
              <span className="text-[11px] text-[var(--muted-foreground)]">Net</span>
              <span
                className="truncate text-base font-bold leading-tight sm:text-lg"
                style={{ color: netTotal >= 0 ? "var(--positive)" : "var(--foreground)" }}
              >
                {formatCurrency(netTotal, currency)}
              </span>
            </div>
          </div>

          <GlassCardDivider />

          <div className="h-44" role="img" aria-label="Cash flow chart — tap a bar to view transactions">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={2} stackOffset="sign" margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  interval={tickInterval as number | "preserveStartEnd"}
                />
                <YAxis hide domain={[-maxAbs * 1.15, maxAbs * 1.15]} />
                <ReferenceLine y={0} stroke="var(--divider)" strokeWidth={1} />
                <Tooltip cursor={{ fill: "var(--hover)" }} content={<FlowTooltip currency={currency} />} />
                <Bar
                  dataKey="inflow"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={9}
                  isAnimationActive
                  animationDuration={400}
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(data) => navigateToPoint((data as { dateKey?: string }).dateKey)}
                >
                  {chartData.map((entry) => (
                    <Cell key={`in-${entry.label}`} fill="var(--primary)" />
                  ))}
                </Bar>
                <Bar
                  dataKey="outflow"
                  radius={[0, 0, 3, 3]}
                  maxBarSize={9}
                  isAnimationActive
                  animationDuration={400}
                  animationEasing="ease-out"
                  cursor="pointer"
                  onClick={(data) => navigateToPoint((data as { dateKey?: string }).dateKey)}
                >
                  {chartData.map((entry) => (
                    <Cell key={`out-${entry.label}`} fill="var(--muted-foreground)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </GlassCard>
  )
})