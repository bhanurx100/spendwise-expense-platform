'use client'

/**
 * DistributionCard — DESIGN_SYSTEM.md §06/§26
 *
 * Corrections vs. the prior version:
 * - Segments were colored by whatever `segment.color` the caller passed in
 *   (a rainbow across account types). A balance breakdown is money, not a
 *   Categories-orbit-style multi-hue exception (§18 scopes that exception
 *   narrowly to Categories only) — so segments are now a blue-hue ladder
 *   (darkest → lightest) instead, keeping them visually distinguishable
 *   without introducing new hues.
 * - Per-dot glow (`boxShadow: 0 0 8px ${seg.color}`) removed — glow is
 *   reserved for the press state only (§10/§26), never decoration at rest.
 * - The card wrapper used a `strong` prop and a manual glow shadow
 *   referencing `--info`, a variable that doesn't exist in the current
 *   token set (globals.css v2). Updated to GlassCard's real API
 *   (radius/padding), which already supplies the correct hairline + shadow.
 * - Legend row highlight used bespoke `.glass` / `.hover:bg-glass` utility
 *   classes; swapped for the same surface-elevated treatment used
 *   elsewhere, so this file doesn't depend on styles defined nowhere else
 *   in the provided token set.
 *
 * Note: this component isn't currently imported by the Accounts page — if
 * it's dead code, it's safe to delete; if something else renders it,
 * confirm that consumer expects blue-only segments (per §06) rather than
 * per-type color, since that's the behavior change here.
 */

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { DonutChart } from '@/src/shared/components/donut-chart'
import { GlassCard } from '@/src/shared/components/glass-card'
import { formatCurrency } from '@/src/shared/lib/format'
import type { DistributionSegment } from '@/src/types/transaction'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

/** Single-hue blue ladder, darkest → lightest. See file header. */
const BLUE_LADDER = ['#3B82F6', '#5B9BF8', '#82B4FA', '#AACFFC', '#D1E6FE']

interface DistributionCardProps {
  segments: DistributionSegment[]
  totalBalance: number
  changePercent: number
}

export function DistributionCard({ segments, totalBalance, changePercent }: DistributionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const tintedSegments = useMemo(
    () => segments.map((s, i) => ({ ...s, color: BLUE_LADDER[i % BLUE_LADDER.length] })),
    [segments],
  )

  return (
    <GlassCard radius="cardLg" padding="lg">
      <div className="flex flex-col items-center">
        <DonutChart
          segments={tintedSegments.map((s) => ({ id: s.id, percent: s.percent, color: s.color, label: s.label }))}
          size={200}
          strokeWidth={20}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          label="Balance distribution across account types"
        >
          <span className="text-xs text-[var(--muted-foreground)]">Total Balance</span>
          <AnimatedAmount
            value={totalBalance}
            className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--foreground)]"
          />
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--positive)]">
            <TrendingUp className="size-3" aria-hidden="true" />
            {changePercent}% vs last month
          </span>
        </DonutChart>
      </div>

      <ul className="mt-5 flex flex-col" aria-label="Balance by account type">
        {tintedSegments.map((seg) => {
          const active = selectedId === seg.id
          return (
            <li key={seg.id}>
              <motion.button
                type="button"
                onClick={() => setSelectedId(active ? null : seg.id)}
                whileTap={{ scale: 0.98 }}
                aria-pressed={active}
                className={`flex min-h-12 w-full items-center gap-3 rounded-[var(--radius)] px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)] ${
                  active ? 'bg-[var(--surface-elevated)]' : 'hover:bg-[var(--surface-elevated)]/60'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                  {seg.label}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--foreground)]">
                  {formatCurrency(seg.amount)}
                </span>
                <span className="w-12 shrink-0 rounded-[var(--radius-tile)] border border-[var(--border)] py-1 text-center text-xs font-semibold text-[var(--muted-foreground)]">
                  {seg.percent}%
                </span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </GlassCard>
  )
}