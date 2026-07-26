'use client'

import { TransactionActions } from '@/src/features/transactions/components/transaction-actions'
import { TransactionTimeline } from '@/src/features/transactions/sections/transaction-timeline'
import { monthGroups } from '@/src/lib/data'
import { IconButton } from '@/src/shared/components/icon-button'
import { MobileShell } from '@/src/shared/components/mobile-shell'
import { PageHeader } from '@/src/shared/components/page-header'
import { SegmentedTabs, type SegmentedOption } from '@/src/shared/components/segmented-tabs'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  LayoutGrid,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

const validTypes = new Set(['all', 'income', 'expense', 'transfer', 'refund'])

function TransactionsContent() {
  const searchParams = useSearchParams()
  const [type, setType] = useState('all')
  const highlightDate = searchParams.get('date') ?? undefined
  const highlightMonth = searchParams.get('month') ?? undefined

  // Deep links (e.g. Overview → /transactions?type=income) land pre-filtered.
  useEffect(() => {
    const param = searchParams.get('type')
    if (param && validTypes.has(param)) setType(param)
  }, [searchParams])

  // Filters are a lightweight segmented control — visually distinct from
  // the circular quick actions above, with semantic active tones.
  const typeFilters = useMemo<SegmentedOption[]>(() => {
    const all = monthGroups.flatMap((g) => g.transactions)
    const count = (pred: (t: (typeof all)[number]) => boolean) => all.filter(pred).length
    return [
      { id: 'all', label: 'All', icon: LayoutGrid, count: all.length, tone: 'primary' },
      { id: 'income', label: 'Income', icon: ArrowDownLeft, count: count((t) => t.type === 'income' || t.type === 'refund'), tone: 'primary' },
      { id: 'expense', label: 'Expense', icon: ArrowUpRight, count: count((t) => t.type === 'expense'), tone: 'primary' },
      { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, count: count((t) => t.type === 'transfer'), tone: 'primary' },
      { id: 'refund', label: 'Refund', icon: RotateCcw, count: count((t) => t.type === 'refund'), tone: 'primary' },
    ]
  }, [])

  return (
    <MobileShell>
      <PageHeader
        title="Transactions"
        subtitle="Your money stories"
        actions={
          <>
            <IconButton icon={Search} label="Search transactions" />
            <IconButton icon={Bell} label="Notifications" />
          </>
        }
      />

      <TransactionActions />

      {/* Breathing room separates tools (actions) from navigation (filters) */}
      <SegmentedTabs
        options={typeFilters}
        value={type}
        onChange={setType}
        layoutId="transaction-type-tab"
        ariaLabel="Filter transactions by type"
        className="mt-3"
      />

      <TransactionTimeline
        groups={monthGroups}
        activeType={type}
        highlightDate={highlightDate}
        highlightMonth={highlightMonth}
      />
    </MobileShell>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  )
}
