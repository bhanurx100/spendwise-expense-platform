'use client'

import { CategoryIcon } from '@/src/shared/components/category-icon'
import { GlassCard } from '@/src/shared/components/glass-card'
import { formatCurrency } from '@/src/shared/lib/format'
import type { MonthGroup, Transaction, TransactionType } from '@/src/types/transaction'
import { AnimatePresence, motion } from 'framer-motion'
import { Receipt, RefreshCw, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Redesigned to match the confirmed Transactions reference exactly.
//
// Removed entirely, per DESIGN_SYSTEM.md §00/§06/§10/§26:
//  - The vertical "spine" timeline (connecting lines, hollow node circles,
//    month-header spine stub) — the reference has no spine at all, it's a
//    flat grouped list.
//  - Persistent colored glow/border at rest (`rgba(34,211,238,...)` cyan on
//    every GlassCard) — glow only exists mid-press now, via GlassCard's own
//    `interactive` prop.
//  - Red for expense, cyan for refund/transfer/info, colored Split/Recurring/
//    Bill badges — expenses and transfers are neutral text; only income and
//    refund (money moving in the user's favor) render in --positive green.
//    Meta badges are monochrome.
//  - Hardcoded `border-white/8`, `text-info`, `text-warning` etc. — these
//    tokens don't exist anymore post-correction; everything now reads
//    --card / --border / --foreground / --muted-foreground / --positive,
//    so light mode Just Works instead of silently rendering broken/invisible
//    styles.
//
// Added: day-level grouping (the reference shows "19 Jul 2026" / "18 Jul
// 2026" headers — the prior version only grouped by month).
// ─────────────────────────────────────────────────────────────────────────────

/** Only income and refund are money moving in the user's favor. Everything else is neutral text — never red. */
function amountColor(type: TransactionType): string {
  return type === 'income' || type === 'refund' ? 'var(--positive)' : 'var(--foreground)'
}

const amountSign: Record<TransactionType, '+' | '-'> = {
  income: '+',
  expense: '-',
  transfer: '-',
  refund: '+',
}

/** Monochrome meta badge — Split / Recurring / Bill. No per-type color, ever. */
function MetaBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
      {icon}
      {children}
    </span>
  )
}

function TransactionRow({
  tx,
  index,
  expanded,
  onToggle,
}: {
  tx: Transaction
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const hasMeta = tx.isSplit || tx.isRecurring || tx.hasReceipt

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 }}
      className="list-none"
    >
      <GlassCard
        interactive
        radius="card"
        padding="md"
        className="flex items-start gap-3"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        aria-label={`${tx.merchant} — ${formatCurrency(tx.amount, tx.currency)}`}
      >
        {/* Leading icon tile — monochrome at rest, always. §13. No colored shadow. */}
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
          <CategoryIcon name={tx.icon} className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-[var(--foreground)]">
            {tx.merchant}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[var(--muted-foreground)]">
            {tx.account} · {tx.category}
          </p>

          {hasMeta && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {tx.isSplit && <MetaBadge icon={<Users className="size-2.5" aria-hidden="true" />}>Split</MetaBadge>}
              {tx.isRecurring && (
                <MetaBadge icon={<RefreshCw className="size-2.5" aria-hidden="true" />}>Recurring</MetaBadge>
              )}
              {tx.hasReceipt && (
                <MetaBadge icon={<Receipt className="size-2.5" aria-hidden="true" />}>Bill</MetaBadge>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <p className="text-[15px] font-semibold tabular-nums" style={{ color: amountColor(tx.type) }}>
            {amountSign[tx.type]}
            {formatCurrency(tx.amount, tx.currency)}
          </p>
          <p className="text-[12px] text-[var(--muted-foreground)]">{tx.time}</p>
        </div>
      </GlassCard>

      {/* Expandable details — no visible chevron on the row itself, matching the
          reference exactly; the whole card is tappable (Apple Wallet's own
          transaction rows work the same way, no per-row disclosure indicator). */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-xs">
              <div>
                <p className="text-[var(--muted-foreground)]">Account</p>
                <p className="mt-0.5 font-medium text-[var(--foreground)]">{tx.account}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Category</p>
                <p className="mt-0.5 font-medium text-[var(--foreground)]">{tx.category}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Status</p>
                <p className="mt-0.5 font-medium capitalize text-[var(--foreground)]">{tx.status ?? 'completed'}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Date</p>
                <p className="mt-0.5 font-medium text-[var(--foreground)]">
                  {tx.date} · {tx.time}
                </p>
              </div>
              {tx.subtitle && (
                <div className="col-span-2">
                  <p className="text-[var(--muted-foreground)]">Note</p>
                  <p className="mt-0.5 font-medium text-[var(--foreground)]">{tx.subtitle}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

function DayHeader({ label }: { label: string }) {
  return <p className="mb-2.5 px-1 text-[13px] font-medium text-[var(--muted-foreground)]">{label}</p>
}

/** Groups an already-ordered transaction list by its display date string ("19 Jul 2026"). */
function groupByDay(transactions: Transaction[]): Array<[string, Transaction[]]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = tx.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return Array.from(map.entries())
}

interface TransactionTimelineProps {
  groups: MonthGroup[]
  activeType: string
  /** ISO date (YYYY-MM-DD) — expand matching transaction when deep-linked. */
  highlightDate?: string
  /** Month key (YYYY-MM) — scroll to matching month group. */
  highlightMonth?: string
}

/**
 * Renders the grouped transaction list. Name kept as `TransactionTimeline`
 * for import-path compatibility, though the visual is now a flat grouped
 * list, not a timeline/spine — matches the confirmed reference exactly.
 */
export function TransactionTimeline({ groups, activeType, highlightDate, highlightMonth }: TransactionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const monthRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (highlightDate) {
      for (const group of groups) {
        const match = group.transactions.find((t) => t.isoDate === highlightDate)
        if (match) {
          setExpandedId(match.id)
          monthRefs.current[group.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
      }
    }
    if (highlightMonth) {
      monthRefs.current[highlightMonth]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [highlightDate, highlightMonth, groups])

  const visibleGroups = groups
    .map((group) => ({
      group,
      visible:
        activeType === 'all'
          ? group.transactions
          : group.transactions.filter((t) =>
            activeType === 'income' ? t.type === 'income' || t.type === 'refund' : t.type === activeType,
          ),
    }))
    .filter(({ visible }) => visible.length > 0)

  if (visibleGroups.length === 0) {
    return (
      <GlassCard radius="card" padding="lg" className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm font-semibold text-[var(--foreground)]">No transactions yet</p>
        <p className="max-w-56 text-xs leading-relaxed text-[var(--muted-foreground)]">
          Add your first transaction and it will appear here.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {visibleGroups.map(({ group, visible }) => (
        <section
          key={group.id}
          ref={(el) => {
            monthRefs.current[group.id] = el
          }}
          aria-label={`${group.month} ${group.year} transactions`}
        >
          {/* Month summary — flat GlassCard, no spine stub, no colored border/glow. */}
          <GlassCard radius="card" padding="lg" className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[17px] font-bold text-[var(--foreground)]">
                {group.month} {group.year}
              </p>
              <p className="text-[13px] text-[var(--muted-foreground)]">Total Spent</p>
            </div>
            <p className="text-[20px] font-bold tabular-nums text-[var(--foreground)]">
              {formatCurrency(group.totalSpent, group.currency)}
            </p>
          </GlassCard>

          {groupByDay(visible).map(([day, dayTx]) => (
            <div key={day} className="mb-6 last:mb-0">
              <DayHeader label={day} />
              <ul className="flex flex-col gap-1.5">
                <AnimatePresence mode="popLayout">
                  {dayTx.map((tx, i) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      index={i}
                      expanded={expandedId === tx.id}
                      onToggle={() => setExpandedId((cur) => (cur === tx.id ? null : tx.id))}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}