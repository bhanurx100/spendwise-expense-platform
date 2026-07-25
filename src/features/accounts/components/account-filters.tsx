'use client'

/**
 * Account type filter — DESIGN_SYSTEM.md §12.1 (Focus Bubble segmented control)
 *
 * Replaces the prior circular quick-action row (each icon tinted per a
 * "tone" — primary/info/warning/positive). Two problems with that version:
 * 1. It reused the Quick-Action component for a job that's actually a
 *    mutually-exclusive filter — the correct shared component is
 *    `GlassSegment` (§16), the same one Transactions/Categories/Overview use.
 * 2. Per-type tinted icons reintroduce the purple/blue/orange/green accents
 *    §00 and §13 explicitly rule out for icon tiles at rest.
 *
 * This now matches the reference screenshot: a single pill row with one
 * shared traveling indicator (the "Focus Bubble"), not a static per-chip fill.
 */

import { GlassSegment, type GlassSegmentOption } from '@/src/shared/components/glass-segment'
import { CreditCard, Landmark, LayoutGrid, Nfc, Wallet } from 'lucide-react'
import { useMemo } from 'react'

export type AccountFilter = 'all' | 'bank' | 'credit-card' | 'debit-card' | 'wallet'

export function AccountFilters({
  value,
  onChange,
}: {
  value: AccountFilter
  onChange: (value: AccountFilter) => void
}) {
  const options = useMemo<GlassSegmentOption[]>(
    () => [
      { value: 'all', label: 'All', icon: <LayoutGrid className="size-3.5" aria-hidden="true" /> },
      { value: 'bank', label: 'Bank', icon: <Landmark className="size-3.5" aria-hidden="true" /> },
      { value: 'credit-card', label: 'Credit', icon: <CreditCard className="size-3.5" aria-hidden="true" /> },
      { value: 'debit-card', label: 'Debit', icon: <Nfc className="size-3.5" aria-hidden="true" /> },
      { value: 'wallet', label: 'Wallets', icon: <Wallet className="size-3.5" aria-hidden="true" /> },
    ],
    [],
  )

  return (
    <section aria-label="Filter accounts by type" className="w-full overflow-x-auto scrollbar-none">
      <GlassSegment
        options={options}
        value={value}
        onChange={(v) => onChange(v as AccountFilter)}
        layoutId="account-type-filter"
        fullWidth={false}
      />
    </section>
  )
}