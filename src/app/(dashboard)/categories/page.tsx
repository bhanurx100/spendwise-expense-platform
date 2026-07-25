'use client'

import { CategoryExplorer } from '@/src/features/categories/components/category-explorer'
import { SpendingInsight } from '@/src/features/categories/sections/spending-insight'
import {
  categoryInsight,
  getCategoriesForPeriod,
} from '@/src/lib/data'
import { IconButton } from '@/src/shared/components/icon-button'
import { MobileShell } from '@/src/shared/components/mobile-shell'
import { PageHeader } from '@/src/shared/components/page-header'
import { Bell, Search } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'

type Period = '1M' | '3M' | '6M' | '1Y' | 'All'

function CategoriesContent() {
  const [period, setPeriod] = useState<Period>('1M')
  const categories = useMemo(() => getCategoriesForPeriod(period), [period])

  return (
    <MobileShell>
      <PageHeader
        title="Categories"
        subtitle="Understand where your money goes"
        actions={
          <>
            <IconButton icon={Search} label="Search categories" />
            <IconButton icon={Bell} label="Notifications" />
          </>
        }
      />

      <CategoryExplorer
        categories={categories}
        currency="INR"
        period={period}
        onPeriodChange={setPeriod}
      />

      <SpendingInsight insight={categoryInsight} />
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
