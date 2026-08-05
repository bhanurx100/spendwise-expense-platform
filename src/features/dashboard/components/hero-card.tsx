'use client'

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { GlassCard, GlassCardDivider } from '@/src/shared/components/glass-card'
import { getTimeGreeting } from '@/src/shared/lib/format'
import type { BalanceSummary, UserGreeting } from '@/src/types/transaction'
import { ArrowUpRight, CreditCard, Eye, EyeOff, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo, useEffect, useState } from 'react'

type DashboardMetrics = { availableToSpend: number; savingsRate: number | null; dailyBurn: number; monthlyChange: number; monthlyChangePercent: number }

export const HeroCard = memo(function HeroCard({ summary, greeting, insight, metrics }: { summary: BalanceSummary; greeting: UserGreeting; insight: string; metrics: DashboardMetrics }) {
  const [hidden, setHidden] = useState(false)
  const [timeGreeting, setTimeGreeting] = useState('')
  const router = useRouter()
  useEffect(() => setTimeGreeting(getTimeGreeting()), [])
  const improving = metrics.monthlyChange >= 0

  return <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <p className="text-sm text-[var(--muted-foreground)]">{timeGreeting}, {greeting.name}</p>
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--foreground)]">{improving ? 'Your finances are moving in the right direction.' : 'Your finances need attention.'}</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Based on your recorded transactions.</p>
    </div>
    <GlassCard radius="cardLg" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Net Worth</p>
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]"><span className="size-1.5 rounded-full bg-[var(--primary)]" />{improving ? 'Positive cash flow' : 'Cash flow review'}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2"><AnimatedAmount value={summary.totalBalance} currency={summary.currency} hidden={hidden} className="tabular-nums text-[2.125rem] font-bold leading-none tracking-tight text-[var(--foreground)]" /><button type="button" aria-label={hidden ? 'Show balance' : 'Hide balance'} aria-pressed={hidden} onClick={() => setHidden((value) => !value)} className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">{hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
          <p className="text-sm"><span className="font-semibold text-[var(--primary)]">{improving ? '+' : ''}{metrics.monthlyChange.toLocaleString('en-IN')} ({metrics.monthlyChangePercent.toFixed(1)}%)</span> <span className="text-[var(--muted-foreground)]">vs last month</span></p>
        </div>
        <GlassCard radius="tile" padding="none" className="flex size-11 shrink-0 items-center justify-center text-[var(--foreground)]"><ArrowUpRight className="size-5" /></GlassCard>
      </div>
      <GlassCardDivider />
      <div className="grid grid-cols-3 gap-3">
        <Metric icon={CreditCard} label="Available to Spend" value={`₹${metrics.availableToSpend.toLocaleString('en-IN')}`} />
        <Metric icon={TrendingUp} label="Savings Rate" value={metrics.savingsRate === null ? '—' : `${metrics.savingsRate.toFixed(0)}%`} sublabel="of income" />
        <Metric icon={Zap} label="Daily Burn" value={`₹${metrics.dailyBurn.toLocaleString('en-IN')}`} sublabel="avg / day" />
      </div>
      <button type="button" onClick={() => router.push('/categories')} className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3.5 text-left transition-colors hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-ring"><Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" /><span className="text-sm leading-snug text-[var(--foreground)]">{insight}</span></button>
    </GlassCard>
  </div>
})

function Metric({ icon: Icon, label, value, sublabel }: { icon: typeof Wallet; label: string; value: string; sublabel?: string }) {
  return <div className="flex flex-col gap-1.5"><span className="flex size-8 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]"><Icon className="size-4" /></span><p className="truncate text-[11px] text-[var(--muted-foreground)]">{label}</p><p className="truncate text-base font-bold tabular-nums text-[var(--foreground)]">{value}</p>{sublabel && <p className="truncate text-[11px] text-[var(--muted-foreground)]">{sublabel}</p>}</div>
}
