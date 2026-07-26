'use client'

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { GlassCard } from '@/src/shared/components/glass-card'
import type { MoneySummary } from '@/src/types/transaction'
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import Link from 'next/link'

/**
 * Unified monthly flow card — one surface, three metrics.
 * Replaces the previous three-card row for cleaner hierarchy.
 */
export function MoneySummaryRow({ summary }: { summary: MoneySummary }) {
  const netPositive = summary.netBalance >= 0

  const items = [
    {
      id: 'in',
      label: 'Money In',
      value: summary.moneyIn,
      icon: ArrowDownLeft,
      tone: 'text-[var(--primary)]',
      iconBg: 'bg-[var(--primary)]/12 text-[var(--primary)]',
      href: '/transactions?type=income',
      signed: false,
    },
    {
      id: 'out',
      label: 'Money Out',
      value: summary.moneyOut,
      icon: ArrowUpRight,
      tone: 'text-[var(--primary)]',
      iconBg: 'bg-[var(--primary)]/12 text-[var(--primary)]',
      href: '/transactions?type=expense',
      signed: false,
    },
    {
      id: 'net',
      label: 'Net Balance',
      value: summary.netBalance,
      icon: Wallet,
      tone: 'text-[var(--primary)]',
      iconBg: 'bg-[var(--primary)]/12 text-[var(--primary)]',
      href: '/transactions',
      signed: true,
    },
  ] as const

  return (
    <section aria-label="Monthly money summary">
      <GlassCard radius="2xl" padding="lg" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,217,255,0.06), transparent 65%)',
          }}
          aria-hidden="true"
        />

        <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground">This month</p>

        <div className="grid grid-cols-3 divide-x divide-white/8">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={`${item.label} — view transactions`}
                className="group flex min-w-0 flex-col gap-2 px-2 first:pl-0 last:pr-0 focus-visible:outline-2 focus-visible:outline-ring sm:px-3"
              >
                <span className={`flex size-8 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{item.label}</span>
                <AnimatedAmount
                  value={item.value}
                  currency={summary.currency}
                  signed={item.signed}
                  className={`truncate text-base font-bold leading-tight sm:text-lg ${item.tone}`}
                />
              </Link>
            )
          })}
        </div>
      </GlassCard>
    </section>
  )
}
