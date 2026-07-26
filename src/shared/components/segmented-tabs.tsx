'use client'

import { cn } from '@/src/lib/utils'
import { springs } from '@/src/shared/lib/motion'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export interface SegmentedOption {
  id: string
  label: string
  icon?: LucideIcon
  count?: number
  /** Active-pill tone — only primary (blue) is used now. */
  tone?: 'primary'
}

const toneStyles = {
  primary: {
    pill: 'rgba(124,60,255,0.22)',
    text: 'text-primary-bright',
    badge: 'bg-primary/25 text-primary-bright',
  },
}

/**
 * Premium segmented control — lightweight glass track with a spring
 * sliding pill. Utility-focused counterpart to the circular quick
 * actions: filters look like navigation, actions look like tools.
 */
export function SegmentedTabs({
  options,
  value,
  onChange,
  layoutId,
  ariaLabel,
  className,
}: {
  options: SegmentedOption[]
  value: string
  onChange: (id: string) => void
  layoutId: string
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'glass inline-flex gap-1 overflow-x-auto rounded-full p-0.5 scrollbar-none',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value
        const tone = toneStyles[option.tone ?? 'primary']
        const Icon = option.icon
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className="relative flex min-h-7 items-center justify-center gap-1 rounded-full px-3 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-ring"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={springs.snappy}
                aria-hidden
                className="absolute inset-0 rounded-full border"
                style={{
                  backgroundColor: tone.pill,
                  borderColor: 'rgba(255,255,255,0.14)',
                  boxShadow: `0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
                }}
              />
            )}
            <span
              className={cn(
                'relative flex items-center gap-1.5 text-xs font-semibold transition-colors duration-300',
                active ? tone.text : 'text-muted-foreground',
              )}
            >
              {Icon && <Icon className="size-3.5" aria-hidden="true" />}
              {option.label}
              {option.count != null && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors duration-300',
                    active ? tone.badge : 'bg-white/6 text-muted-foreground',
                  )}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
