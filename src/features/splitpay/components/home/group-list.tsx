'use client'

import { AvatarStack } from '@/src/shared/components/avatar-stack'
import { CategoryIcon } from '@/src/shared/components/category-icon'
import { GlassCard } from '@/src/shared/components/glass-card'
import { formatCurrency } from '@/src/shared/lib/format'
import { springs } from '@/src/shared/lib/motion'
import type { SplitGroup } from '@/src/types/transaction'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { memo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// GroupList — corrected per PAGE_SPECIFICATIONS.md §05.
//
// - "You owe" is neutral text, not red — owing a friend isn't a destructive
//   or overdue state (DESIGN_SYSTEM.md §06 rule 6).
// - "You're owed" is the only status color, in --positive (money moving in
//   your favor, §06 rule 5).
// - "Settled" is muted/neutral — a calm resting state, not a green flash.
// - Group icon tile is monochrome at rest (no per-group colored circle).
// - Settlement progress bar is --primary (blue) regardless of direction.
// - Uses the shared GlassCard primitive — no page-local border/glow.
// ─────────────────────────────────────────────────────────────────────────────

const statusMeta: Record<
  SplitGroup['status'],
  { label: string; amountColor: string; captionColor: string }
> = {
  'you-owe': { label: 'You owe', amountColor: 'var(--foreground)', captionColor: 'var(--muted-foreground)' },
  'you-are-owed': { label: "You're owed", amountColor: 'var(--positive)', captionColor: 'var(--positive)' },
  settled: { label: 'Settled', amountColor: 'var(--muted-foreground)', captionColor: 'var(--muted-foreground)' },
}

export const GroupList = memo(function GroupList({ groups }: { groups: SplitGroup[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (groups.length === 0) {
    return (
      <section aria-label="Active groups" className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-[var(--card-foreground)]">Active Groups</h2>
        <GlassCard radius="card" padding="lg" animated className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-semibold text-[var(--card-foreground)]">No active splits</p>
          <p className="max-w-56 text-xs leading-relaxed text-[var(--muted-foreground)]">
            Start one with your friends.
          </p>
        </GlassCard>
      </section>
    )
  }

  return (
    <section aria-label="Active groups" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--card-foreground)]">Active Groups</h2>
        <button
          type="button"
          className="flex min-h-11 items-center gap-0.5 rounded-lg text-sm font-medium text-[var(--primary)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        >
          View all
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {groups.map((group, i) => {
          const meta = statusMeta[group.status]
          const progress = group.membersTotal > 0 ? (group.membersSettled / group.membersTotal) * 100 : 100
          const expanded = expandedId === group.id
          const perMember = group.membersTotal > 0 ? group.totalAmount / group.membersTotal : 0

          return (
            <motion.li
              key={group.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.04 }}
            >
              <GlassCard
                interactive
                radius="card"
                padding="sm"
                className="flex cursor-pointer items-center gap-3"
                onClick={() => setExpandedId((cur) => (cur === group.id ? null : group.id))}
                role="button"
                aria-expanded={expanded}
                aria-label={`${group.name} — ${meta.label} ${formatCurrency(group.amount, group.currency)}. Toggle details.`}
              >
                {/* Monochrome icon tile — no colored circle at rest */}
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
                  <CategoryIcon name={group.emojiIcon} className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--card-foreground)]">{group.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {group.status === 'settled'
                      ? 'All settled'
                      : `${group.membersSettled} of ${group.membersTotal} settled`}
                  </p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <AvatarStack initials={group.memberAvatars} extra={group.extraMembers} />
                    <div
                      className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-elevated)]"
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${group.name} settlement progress`}
                    >
                      <motion.div
                        className="h-full rounded-full bg-[var(--primary)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span className="text-[11px] font-medium" style={{ color: meta.captionColor }}>
                    {meta.label}
                  </span>
                  <p
                    className="text-sm font-bold tabular-nums"
                    style={{ color: meta.amountColor }}
                  >
                    {formatCurrency(group.amount, group.currency)}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    of {formatCurrency(group.totalAmount, group.currency)}
                  </p>
                  <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={springs.soft}
                    className="text-[var(--muted-foreground)]"
                  >
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </motion.span>
                </div>
              </GlassCard>

              {/* Expandable settlement details */}
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs">
                          <p className="text-[var(--muted-foreground)]">Split per member</p>
                          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--card-foreground)]">
                            {formatCurrency(Math.round(perMember), group.currency)}
                          </p>
                        </div>
                        <div className="text-xs">
                          <p className="text-[var(--muted-foreground)]">Progress</p>
                          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--primary)]">
                            {Math.round(progress)}%
                          </p>
                        </div>
                        <div className="text-xs">
                          <p className="text-[var(--muted-foreground)]">Members</p>
                          <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--card-foreground)]">
                            {group.membersSettled}/{group.membersTotal} settled
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
})