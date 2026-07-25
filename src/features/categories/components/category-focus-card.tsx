'use client'

import { CategoryIcon } from '@/src/shared/components/category-icon'
import { formatCurrency } from '@/src/shared/lib/format'
import type { CategorySummary, Currency } from '@/src/types/transaction'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, ArrowDownRight } from 'lucide-react'

interface CategoryFocusCardProps {
    category: CategorySummary | undefined
    currency: Currency
    period?: '1M' | '3M' | '6M' | '1Y' | 'All'
}

/**
 * Enhanced detail card for the selected category with comprehensive stats:
 * - Total spend and percentage of total
 * - Transaction count and average transaction
 * - Highest spend with merchant
 * - Budget progress with visual bar
 * - Month-over-month comparison with trend indicator
 */
export function CategoryFocusCard({ category, currency, period }: CategoryFocusCardProps) {
    if (!category) return null

    const budgetUsed = category.budget ? Math.min((category.amount / category.budget) * 100, 100) : null
    const status = budgetUsed == null ? null : budgetUsed >= 100 ? 'over' : budgetUsed >= 80 ? 'near' : null
    const trendUp = (category.trend ?? 0) > 0
    const avgTransaction = category.transactionCount > 0 ? category.amount / category.transactionCount : 0

    return (
        <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="glow-zone glass-card rounded-[var(--radius-lg)] p-5"
        >
            {/* Header with icon, name, and amount */}
            <div className="flex items-center gap-3.5">
                <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-elevated)]"
                    style={{ color: 'var(--primary)' }}
                >
                    <CategoryIcon name={category.icon} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--muted-foreground)]">Monthly Spend</p>
                    <p className="truncate text-base font-bold text-[var(--foreground)]">{category.name}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold tabular-nums text-[var(--foreground)]">
                        {formatCurrency(category.amount, currency)}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                        {category.percent}% of total
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[var(--surface-elevated)] p-3">
                    <p className="text-[11px] text-[var(--muted-foreground)]">Transactions</p>
                    <p className="text-sm font-bold tabular-nums text-[var(--foreground)]">{category.transactionCount || 0}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-elevated)] p-3">
                    <p className="text-[11px] text-[var(--muted-foreground)]">Avg. Transaction</p>
                    <p className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                        {formatCurrency(avgTransaction, currency)}
                    </p>
                </div>
            </div>

            {/* Highest spend */}
            {category.highestSpend && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--surface-elevated)] px-3 py-2.5">
                    <div>
                        <p className="text-[11px] text-[var(--muted-foreground)]">Highest Spend</p>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                            {formatCurrency(category.highestSpend.amount, currency)}
                            <span className="ml-1 text-xs text-[var(--muted-foreground)]">On {category.highestSpend.merchant}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Budget progress */}
            {budgetUsed != null && category.budget != null && period === '1M' && (
                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--foreground)]">Budget Progress</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            {formatCurrency(category.amount, currency)} / {formatCurrency(category.budget, currency)}
                        </p>
                    </div>
                    <div
                        className="h-2 overflow-hidden rounded-full bg-[var(--divider)]"
                        role="progressbar"
                        aria-valuenow={Math.round(budgetUsed)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${category.name} budget used`}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                backgroundColor: status === 'over' ? 'var(--destructive)' : status === 'near' ? 'var(--primary)' : 'var(--primary)'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${budgetUsed}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                    {status && (
                        <p className="mt-1.5 text-[11px] font-semibold" style={{ color: status === 'over' ? 'var(--destructive)' : 'var(--primary)' }}>
                            {status === 'over' ? 'Over budget' : 'Near limit'}
                        </p>
                    )}
                </div>
            )}

            {/* Month-over-month comparison */}
            {category.trend != null && (
                <div className="mt-3.5 flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2.5">
                    <p className="text-xs text-[var(--muted-foreground)]">vs Last Month</p>
                    <div
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: trendUp ? 'var(--destructive)' : 'var(--positive)' }}
                    >
                        {trendUp ? (
                            <TrendingUp className="size-3.5" aria-hidden="true" />
                        ) : (
                            <TrendingDown className="size-3.5" aria-hidden="true" />
                        )}
                        {Math.abs(category.trend)}% {trendUp ? 'More spending' : 'Less spending'}
                    </div>
                </div>
            )}
        </motion.div>
    )
}