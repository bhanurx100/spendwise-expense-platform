'use client'

import { CategoryIcon } from '@/src/shared/components/category-icon'
import { GlassCard } from '@/src/shared/components/glass-card'
import { formatCurrency } from '@/src/shared/lib/format'
import { springs } from '@/src/shared/lib/motion'
import type { CategorySummary, Currency } from '@/src/types/transaction'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface CategoryListProps {
  categories: CategorySummary[]
  currency: Currency
  /** The category currently focused in the orbit above — highlighted here so
   *  the two views always agree on "what am I looking at". */
  selectedId?: string | null
  /** Tapping a row promotes that category to the orbit's center platform. */
  onSelect?: (id: string) => void
  /** Current time period filter — budget only shows for 1M view. */
  period?: '1M' | '3M' | '6M' | '1Y' | 'All'
}

export function CategoryList({ categories, currency, selectedId, onSelect, period }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.soft}
        className="glass-card rounded-[var(--radius)] p-8 text-center"
      >
        <p className="text-sm font-semibold">Nothing here yet</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Categories appear automatically from your transactions.
        </p>
      </motion.div>
    )
  }

  return (
    <ul className="flex flex-col gap-1.5" aria-label="Category budgets">
      {categories.map((cat, i) => {
        const budgetUsed = cat.budget ? Math.min((cat.amount / cat.budget) * 100, 100) : null
        // Section 18: 0–79% no badge · 80–99% blue "Near limit" · ≥100% red "Over budget".
        const status =
          budgetUsed == null ? null : budgetUsed >= 100 ? 'over' : budgetUsed >= 80 ? 'near' : null
        const trendUp = (cat.trend ?? 0) > 0
        const isSelected = cat.id === selectedId

        return (
          <motion.li
            key={cat.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.04 }}
          >
            <GlassCard
              interactive
              selected={isSelected}
              padding="md"
              onClick={() => onSelect?.(cat.id)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3.5">
                {/* Monochrome icon tile — the per-category tint exception lives only
                    in the orbit chart, never in a list row (Section 18). */}
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--foreground)]">
                  <CategoryIcon name={cat.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{cat.name}</p>
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      {formatCurrency(cat.amount, currency)}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {cat.merchantCount != null ? `${cat.merchantCount} merchants` : 'Uncategorized'}
                      {' · '}
                      {cat.percent}% of total
                    </p>
                    {/* Expense trend is neutral text; only a genuinely favorable
                        delta (spending down) renders green (Section 06 rule 5). */}
                    {cat.trend != null && (
                      <p
                        className="flex shrink-0 items-center gap-0.5 text-xs font-medium"
                        style={{ color: trendUp ? 'var(--foreground)' : 'var(--positive)' }}
                      >
                        {trendUp ? (
                          <TrendingUp className="size-3" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="size-3" aria-hidden="true" />
                        )}
                        {Math.abs(cat.trend)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {budgetUsed != null && cat.budget != null && period === '1M' && (
                <div className="mt-3">
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--divider)]"
                    role="progressbar"
                    aria-valuenow={Math.round(budgetUsed)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cat.name} budget used`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--primary)' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${budgetUsed}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
                    {formatCurrency(cat.amount, currency)} of {formatCurrency(cat.budget, currency)} budget
                    {status === 'near' && <span className="ml-1 font-semibold" style={{ color: 'var(--primary)' }}>· Near limit</span>}
                    {status === 'over' && <span className="ml-1 font-semibold" style={{ color: 'var(--destructive)' }}>· Over budget</span>}
                  </p>
                </div>
              )}
            </GlassCard>
          </motion.li>
        )
      })}
    </ul>
  )
}