'use client'

import { CategoryExplorer } from '@/src/features/categories/components/category-explorer'
import { CategoryManagerModal } from '@/src/features/categories/components/category-manager-modal'
import { SpendingInsight } from '@/src/features/categories/sections/spending-insight'
import { useFinancialView } from '@/src/features/dashboard/api/use-financial-view'
import { IconButton } from '@/src/shared/components/icon-button'
import { MobileShell } from '@/src/shared/components/mobile-shell'
import { PageHeader } from '@/src/shared/components/page-header'
import { Bell, Plus, Search } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'
import { rangeForPeriod as sharedRangeForPeriod } from '@/src/lib/date-ranges'

type Period = '1M' | '3M' | '6M' | '1Y' | 'All'

/**
 * Turns a period label into the same `{ from, to }` shape the API accepts
 * (see transaction-service.resolveDateRange / lib/date-ranges.ts).
 *
 * 'All' used to omit `from` entirely on the assumption that meant
 * "unlimited" — it didn't. The server filled an absent `from` in with its
 * own recent-window default (previously 30 days), so "All Time" silently
 * showed the same last-30-days window as everything else. It now reuses
 * the shared helper, which sends an explicit sentinel start date for
 * 'All' so it always means the full history regardless of what the
 * server's own unfiltered default happens to be.
 */
function rangeForPeriod(period: Period): { from?: string; to?: string } {
  if (period === '1M') return sharedRangeForPeriod('30D')
  if (period === '3M') return sharedRangeForPeriod('3M')
  if (period === '6M') return sharedRangeForPeriod('6M')
  if (period === '1Y') return sharedRangeForPeriod('1Y')
  return sharedRangeForPeriod('All')
}

function CategoriesContent() {
  const [period, setPeriod] = useState<Period>('1M')
  const range = useMemo(() => rangeForPeriod(period), [period])
  const { categoryViews: categories, insight, isLoading } = useFinancialView(range)
  const [managerOpen, setManagerOpen] = useState(false)

  if (isLoading) return <MobileShell><p className="py-12 text-center text-sm text-[var(--muted-foreground)]">Loading categories…</p></MobileShell>

  return (
    <MobileShell>
      <PageHeader
        title="Categories"
        subtitle="Understand where your money goes"
        actions={
          <>
            <IconButton icon={Search} label="Search categories" />
            <IconButton icon={Bell} label="Notifications" />
            <IconButton
              icon={Plus}
              label="Add category"
              onClick={() => setManagerOpen(true)}
              className="bg-[var(--surface-elevated)] text-[var(--foreground)]"
            />
          </>
        }
      />

      <CategoryManagerModal open={managerOpen} onClose={() => setManagerOpen(false)} />

      <CategoryExplorer
        categories={categories}
        currency="INR"
        period={period}
        onPeriodChange={setPeriod}
      />

      <SpendingInsight insight={insight} />
    </MobileShell>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <span
            className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">Loading categories</span>
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  )
}
