'use client'

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { GlassCard } from '@/src/shared/components/glass-card'
import { CATEGORY_PALETTE } from '@/src/shared/lib/category-colors'
import { formatCurrency } from '@/src/shared/lib/format'
import type { AccountPreview, AccountType, PortfolioSummary } from '@/src/types/transaction'
import { motion } from 'framer-motion'
import { ChevronRight, TrendingUp, Wallet2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const typeLabels: Record<AccountType, string> = {
  bank: 'Bank',
  'credit-card': 'Credit Card',
  'debit-card': 'Debit Card',
  wallet: 'Wallet',
  cash: 'Cash',
  investment: 'Investments',
}

interface AllocationSlice {
  id: AccountType
  label: string
  amount: number
  percent: number
  color: string
}

/** Real allocation derived from the user's accounts — never invented. */
function useAllocation(accounts: AccountPreview[]): AllocationSlice[] {
  return useMemo(() => {
    const totals: Partial<Record<AccountType, number>> = {}
    for (const account of accounts) {
      totals[account.type] = (totals[account.type] ?? 0) + Math.abs(account.balance)
    }
    const entries = (Object.keys(totals) as AccountType[])
      .map((type) => ({ type, amount: totals[type] ?? 0 }))
      .sort((a, b) => b.amount - a.amount)
    const grand = entries.reduce((sum, entry) => sum + entry.amount, 0)
    if (grand === 0) return []
    return entries.map(({ type, amount }, i) => ({
      id: type,
      label: typeLabels[type],
      amount,
      percent: Math.round((amount / grand) * 100),
      color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    }))
  }, [accounts])
}

export function PortfolioSummarySection({
  portfolio,
  accounts,
}: {
  portfolio: PortfolioSummary
  accounts: AccountPreview[]
}) {
  const allocation = useAllocation(accounts)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const invested = portfolio.totalValue - portfolio.totalGain

  return (
    <section aria-label="Portfolio summary" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Portfolio Summary</h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          View All
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <GlassCard
        className="flex flex-col gap-5 p-5"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Value block */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total Investment Value</p>
            <AnimatedAmount
              value={portfolio.totalValue}
              currency={portfolio.currency}
              className="mt-1 block text-2xl font-extrabold tracking-tight"
            />
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-positive">
              <TrendingUp className="size-3.5" aria-hidden="true" />
              +{formatCurrency(portfolio.todaysChange, portfolio.currency)} today (
              {portfolio.todaysChangePercent}%)
            </p>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Wallet2 className="size-5" aria-hidden="true" />
          </span>
        </div>

        {/* Performance indicators — real numbers, no fake charts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Holdings</p>
            <p className="mt-0.5 text-base font-extrabold tabular-nums">{portfolio.holdings}</p>
          </div>
          <div className="glass rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Invested</p>
            <p className="mt-0.5 truncate text-base font-extrabold tabular-nums">
              {formatCurrency(invested, portfolio.currency)}
            </p>
          </div>
          <div className="glass rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">Total Gain</p>
            <p className="mt-0.5 truncate text-base font-extrabold tabular-nums text-positive">
              +{portfolio.totalGainPercent}%
            </p>
          </div>
        </div>

        {/* Asset allocation — derived from real accounts */}
        {allocation.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-semibold text-muted-foreground">Asset allocation</p>

            {/* Stacked bar — segments spring in, hover isolates */}
            <div
              className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label="Asset allocation across account types"
            >
              {allocation.map((slice, i) => {
                const dim = hoveredId !== null && hoveredId !== slice.id
                return (
                  <motion.div
                    key={slice.id}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22, delay: i * 0.06 }}
                    className="h-full origin-left rounded-full transition-opacity duration-300"
                    style={{
                      width: `${slice.percent}%`,
                      backgroundColor: slice.color,
                      boxShadow: dim ? 'none' : `0 0 10px ${slice.color}55`,
                      opacity: dim ? 0.3 : 1,
                    }}
                    onMouseEnter={() => setHoveredId(slice.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                )
              })}
            </div>

            {/* Legend rows */}
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Allocation details">
              {allocation.map((slice) => {
                const dim = hoveredId !== null && hoveredId !== slice.id
                return (
                  <li key={slice.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredId(slice.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left transition-all duration-300 hover:bg-glass focus-visible:outline-2 focus-visible:outline-ring ${dim ? 'opacity-40' : ''
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color, boxShadow: `0 0 6px ${slice.color}` }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {slice.label}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                        {slice.percent}%
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </GlassCard>
    </section>
  )
}
