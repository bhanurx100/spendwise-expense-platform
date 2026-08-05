'use client'

/**
 * Accounts totals block — size pass.
 *
 * Everything was oversized: the balance figure, the distribution rows, and
 * especially the Net Worth / Available / Card Due tiles. All reduced
 * (smaller type scale, tighter padding). Also now uses `.glass-hero`
 * directly instead of a hand-rolled color-mix background, and the
 * allocation bar's segment widths are clamped so they can never overflow
 * 100% (they could before — Bank alone can exceed the net "Total Balance"
 * once card dues are subtracted, producing >100% widths that silently
 * swallowed the Wallet/Cash segments).
 */

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { formatCurrency } from '@/src/shared/lib/format'
import type { BalanceSummary } from '@/src/types/transaction'
import { motion } from 'framer-motion'
import { Landmark, CreditCard, Wallet, WalletCards, type LucideIcon } from 'lucide-react'

const TYPE_META: ReadonlyArray<{ type: string; icon: LucideIcon; label: string; opacity: number }> = [
  { type: 'bank', icon: Landmark, label: 'Bank', opacity: 1 },
  { type: 'credit-card', icon: CreditCard, label: 'Credit Card', opacity: 0.72 },
  { type: 'wallet', icon: Wallet, label: 'Wallet', opacity: 0.48 },
  { type: 'cash', icon: WalletCards, label: 'Cash', opacity: 0.28 },
]

function TypeIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  )
}

export function AccountsHeadline({ summary, accounts }: { summary: BalanceSummary; accounts: import('@/src/types/transaction').AccountPreview[] }) {
  const realAccounts = accounts

  // Canonical numbers — identical to what Overview's Net Worth /
  // Available to Spend show, because they come from the same `summary`
  // object (see use-financial-view.ts), not a local recalculation.
  const totalBalance = summary.totalBalance
  const netWorth = summary.totalBalance
  const available = summary.availableToSpend ?? summary.totalBalance
  const cardDue = summary.creditOutstanding

  // Presentation-only breakdown by account type, for the distribution bar.
  // `balance` here is a display magnitude for that row of the bar/list —
  // it never feeds back into totalBalance/netWorth above.
  const byType = realAccounts.reduce((acc, a) => {
    const type = a.type === 'debit-card' ? 'bank' : a.type
    if (!acc[type]) acc[type] = { count: 0, balance: 0 }
    acc[type].count += 1
    acc[type].balance += a.type === 'credit-card' ? Math.max(0, -a.balance) : a.balance
    return acc
  }, {} as Record<string, { count: number; balance: number }>)

  const distribution = TYPE_META.map((meta) => ({
    ...meta,
    balance: byType[meta.type]?.balance ?? 0,
    count: byType[meta.type]?.count ?? 0,
  })).filter((d) => d.balance > 0)

  const distributionWithPercents = distribution.map((d) => ({
    ...d,
    percent: totalBalance > 0 ? Math.round((d.balance / totalBalance) * 100) : 0,
  }))

  // Clamp so segment widths can never sum past 100% of the bar, regardless
  // of what the (net-of-dues) percent label says.
  let remaining = 100
  const barSegments = distributionWithPercents.map((d) => {
    const width = Math.max(0, Math.min(d.percent, remaining))
    remaining -= width
    return { ...d, width }
  })

  return (
    <motion.section
      aria-label="Accounts summary"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-hero p-4"
    >
      <div className="flex flex-col gap-3">
        {/* Balance */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Total Balance
          </p>
          <AnimatedAmount
            value={totalBalance}
            currency={summary.currency}
            className="text-[1.875rem] font-extrabold leading-none tracking-tight text-[var(--foreground)]"
          />
          {cardDue > 0 && (
            <p className="text-[11px] text-[var(--muted-foreground)]">
              after {formatCurrency(cardDue, summary.currency)} card dues
            </p>
          )}
        </div>

        {/* Distribution */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-center gap-0">
            <p className="text-[11px] font-semibold text-[var(--foreground)]">Distributed across</p>
            <p className="text-[1rem] font-semibold text-[var(--foreground)]">{realAccounts.length} Accounts</p>
          </div>

          <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-elevated)]">
            {barSegments.map((d) => (
              <div
                key={d.type}
                className="h-full rounded-[var(--radius-pill)] bg-[var(--primary)]"
                style={{ width: `${d.width}%`, opacity: d.opacity }}
                aria-label={`${d.label}: ${d.percent}%`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {distributionWithPercents.map((d) => (
              <motion.div
                key={d.type}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1.5"
              >
                <TypeIcon Icon={d.icon} />
                <div className="flex min-w-0 flex-1 flex-col gap-0">
                  <span className="truncate text-[11px] font-semibold leading-tight text-[var(--foreground)]">
                    {d.label}
                  </span>
                  <span className="text-[10px] leading-tight text-[var(--muted-foreground)]">
                    {d.count} account{d.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[13px] font-bold tabular-nums leading-none text-[var(--foreground)]">
                  {formatCurrency(d.balance, summary.currency)}
                </span>
                <span className="text-[11px] font-semibold tabular-nums leading-none text-[var(--muted-foreground)]">
                  {d.percent}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom metrics — reduced drastically vs. the prior pass */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Net Worth', value: netWorth },
            { label: 'Available', value: available },
            { label: 'Card Due', value: cardDue },
          ].map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-0 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1.5"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                {m.label}
              </p>
              <p className="text-[13px] font-bold tabular-nums leading-tight text-[var(--foreground)]">
                {formatCurrency(m.value, summary.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}