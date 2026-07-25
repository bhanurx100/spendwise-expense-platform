'use client'

import { springs } from '@/src/shared/lib/motion'
import { cn } from '@/src/lib/utils'
import { GlassSegment, type GlassSegmentOption } from '@/src/shared/components/glass-segment'
import type { CategorySummary, Currency } from '@/src/types/transaction'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  SlidersHorizontal,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryFocusCard } from './category-focus-card'
import { CategoryList } from './category-list'
import { CategoryOrbit } from './category-orbit'

interface CategoryExplorerProps {
  categories: CategorySummary[]
  currency: Currency
  period: '1M' | '3M' | '6M' | '1Y' | 'All'
  onPeriodChange: (period: '1M' | '3M' | '6M' | '1Y' | 'All') => void
}

const periodOptions: GlassSegmentOption[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'All', label: 'All' },
]

type SortMode = 'amount_desc' | 'amount_asc' | 'name_asc' | 'over_budget_first'

const sortMenuOptions: { id: SortMode; label: string; icon: LucideIcon }[] = [
  { id: 'amount_desc', label: 'Highest spend first', icon: ArrowDownWideNarrow },
  { id: 'amount_asc', label: 'Lowest spend first', icon: ArrowUpNarrowWide },
  { id: 'name_asc', label: 'Name (A–Z)', icon: ArrowDownAZ },
  { id: 'over_budget_first', label: 'Over budget first', icon: TriangleAlert },
]

function sortCategories(categories: CategorySummary[], mode: SortMode): CategorySummary[] {
  const list = [...categories]
  switch (mode) {
    case 'amount_asc':
      return list.sort((a, b) => a.amount - b.amount)
    case 'name_asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'over_budget_first':
      return list.sort((a, b) => {
        const usedA = a.budget ? a.amount / a.budget : 0
        const usedB = b.budget ? b.amount / b.budget : 0
        return usedB - usedA
      })
    case 'amount_desc':
    default:
      return list.sort((a, b) => b.amount - a.amount)
  }
}

/** The "filter button above the cards" — sort/customize the list below.
 *  This was the other missing piece: a way to reorder the list without
 *  touching the orbit or the group filter. */
function ListSortMenu({ value, onChange }: { value: SortMode; onChange: (m: SortMode) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Sort categories"
        aria-expanded={open}
        className="glass-tile flex size-9 items-center justify-center text-[var(--foreground)]"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            className="glass-card absolute right-0 top-11 z-30 w-52 rounded-[var(--radius)] p-1.5"
          >
            {sortMenuOptions.map((opt) => {
              const Icon = opt.icon
              const active = value === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                    active ? 'text-[var(--primary)]' : 'text-[var(--foreground)] hover:bg-[var(--hover)]',
                  )}
                  style={active ? { background: 'color-mix(in oklab, var(--primary) 10%, transparent)' } : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {opt.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function CategoryExplorer({ categories, currency, period, onPeriodChange }: CategoryExplorerProps) {
  const [sortMode, setSortMode] = useState<SortMode>('amount_desc')
  // Shared selection — synced between the orbit's center platform, the focus
  // card, and the highlighted row in the list. Lifted here so all three agree.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sortedList = useMemo(() => sortCategories(categories, sortMode), [categories, sortMode])
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedId),
    [categories, selectedId],
  )

  return (
    <section aria-label="Explore categories" className="flex flex-col gap-5">
      <GlassSegment
        options={periodOptions}
        value={period}
        onChange={onPeriodChange}
        layoutId="category-period-filter"
      />

      {categories.length > 0 ? (
        <>
          <CategoryOrbit
            categories={categories}
            currency={currency}
            selectedId={selectedId}
            onSelectChange={setSelectedId}
          />

          <AnimatePresence mode="wait">
            <CategoryFocusCard key={selectedCategory?.id ?? 'none'} category={selectedCategory} currency={currency} period={period} />
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Categories</h2>
            <ListSortMenu value={sortMode} onChange={setSortMode} />
          </div>

          <CategoryList
            categories={sortedList}
            currency={currency}
            selectedId={selectedId}
            onSelect={setSelectedId}
            period={period}
          />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.soft}
          className="glass-card rounded-[var(--radius)] p-8 text-center"
        >
          <p className="text-sm font-semibold">No categories yet</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Add a transaction and it will appear here automatically.
          </p>
        </motion.div>
      )}
    </section>
  )
}