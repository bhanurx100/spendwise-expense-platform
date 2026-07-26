'use client'

import { CategoryIcon } from '@/src/shared/components/category-icon'
import { GlassCard } from '@/src/shared/components/glass-card'
import type { Insight } from '@/src/types/transaction'
import { cn } from '@/src/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const toneClass: Record<Insight['tone'], string> = {
  positive: 'text-[var(--primary)]',
  negative: 'text-[var(--primary)]',
  info: 'text-[var(--primary)]',
  warning: 'text-[var(--primary)]',
}

const toneDot: Record<Insight['tone'], string> = {
  positive: 'bg-[var(--primary)]',
  negative: 'bg-[var(--primary)]',
  info: 'bg-[var(--primary)]',
  warning: 'bg-[var(--primary)]',
}

/**
 * Spending insights — generated live from the transaction store by the
 * insight engine (`buildInsights`). The card rotates through the top
 * findings; when the data changes, what you read here changes with it.
 */
export function InsightCard({ insights }: { insights: Insight[] }) {
  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)
  const rotation = insights.slice(0, 5)

  useEffect(() => {
    if (rotation.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % rotation.length), 6000)
    return () => clearInterval(id)
  }, [rotation.length])

  if (rotation.length === 0) return null

  const insight = rotation[index % rotation.length]

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div exit={{ opacity: 0, height: 0, marginTop: -16 }} transition={{ duration: 0.3 }}>
          <GlassCard
            className="relative flex items-start gap-4 overflow-hidden p-5"
            style={{ borderColor: 'rgba(59,130,246,0.42)', boxShadow: '0 0 16px rgba(59,130,246,0.22)' }}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/8',
                toneClass[insight.tone],
              )}
              style={{ boxShadow: '0 0 16px color-mix(in srgb, var(--primary) 10%, transparent)' }}
            >
              <CategoryIcon name={insight.icon} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <h2 className="text-sm font-bold">{insight.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.cta && insight.href && (
                    <Link
                      href={insight.href}
                      className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg text-sm font-semibold text-primary transition-colors hover:text-primary-bright focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {insight.cta}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>
              {/* Rotation indicator */}
              {rotation.length > 1 && (
                <div className="mt-2.5 flex items-center gap-1" aria-hidden="true">
                  {rotation.map((r, i) => (
                    <span
                      key={r.id}
                      className={cn(
                        'h-1 rounded-full transition-all duration-500',
                        i === index % rotation.length
                          ? cn('w-3.5', toneDot[r.tone])
                          : 'w-1 bg-white/15',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss insight"
              onClick={() => setDismissed(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" />
            </button>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
