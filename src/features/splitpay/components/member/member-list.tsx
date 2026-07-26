'use client'

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { GlassCard } from '@/src/shared/components/glass-card'
import { GlassSegment, type GlassSegmentOption } from '@/src/shared/components/glass-segment'
import { springs } from '@/src/shared/lib/motion'
import type { SplitGroup, SplitMember } from '@/src/types/transaction'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { memo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// MemberList — corrected per PAGE_SPECIFICATIONS.md §05 / §06.
//
// - Filter row is GlassSegment (Focus Bubble), the same shared component
//   used everywhere else in the app — no per-page static-highlight filter.
// - "you-owe" renders neutral, "owes-you" renders --positive (green), and
//   "settled" is muted. No pink/cyan/purple glow, ring, or gradient avatar.
// - Avatars are a flat monochrome tile — direction is communicated by the
//   icon + label, not by avatar color (accessibility color-independence,
//   DESIGN_SYSTEM.md §21).
// ─────────────────────────────────────────────────────────────────────────────

const directionMeta: Record<
  SplitMember['direction'],
  { label: string; amountColor: string; captionColor: string }
> = {
  'you-owe': { label: 'You owe', amountColor: 'var(--foreground)', captionColor: 'var(--muted-foreground)' },
  'owes-you': { label: 'Owes you', amountColor: 'var(--positive)', captionColor: 'var(--positive)' },
  settled: { label: 'Settled up', amountColor: 'var(--muted-foreground)', captionColor: 'var(--muted-foreground)' },
}

function DirectionIcon({ direction }: { direction: SplitMember['direction'] }) {
  if (direction === 'you-owe') return <ArrowUpRight className="size-3.5" aria-hidden="true" />
  if (direction === 'owes-you') return <ArrowDownLeft className="size-3.5" aria-hidden="true" />
  return <Check className="size-3.5" aria-hidden="true" />
}

export const MemberList = memo(function MemberList({
  members,
  groups,
}: {
  members: SplitMember[]
  groups: SplitGroup[]
}) {
  const [filter, setFilter] = useState('all')

  const visible = useMemo(
    () => (filter === 'all' ? members : members.filter((m) => m.direction === filter)),
    [filter, members],
  )

  const filterOptions = useMemo<GlassSegmentOption[]>(
    () => [
      { value: 'all', label: 'All', count: members.length },
      { value: 'you-owe', label: 'You owe', count: members.filter((m) => m.direction === 'you-owe').length },
      { value: 'owes-you', label: "You're owed", count: members.filter((m) => m.direction === 'owes-you').length },
      { value: 'settled', label: 'Settled', count: members.filter((m) => m.direction === 'settled').length },
    ],
    [members],
  )

  // How many real groups each person appears in — derived, never invented.
  const groupCountFor = useMemo(() => {
    const map: Record<string, number> = {}
    for (const member of members) {
      map[member.id] = groups.filter((g) => g.memberAvatars.includes(member.avatar[0])).length
    }
    return map
  }, [members, groups])

  return (
    <section aria-label="People you split with" className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-[var(--card-foreground)]">You&apos;re involved in</h2>

      <div className="w-full overflow-x-auto scrollbar-none">
        <GlassSegment
          options={filterOptions}
          value={filter}
          onChange={setFilter}
          layoutId="splitpay-member-filter"
          fullWidth={false}
        />
      </div>

      {visible.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence mode="popLayout">
            {visible.map((member, i) => {
              const meta = directionMeta[member.direction]
              const sharedGroups = groupCountFor[member.id] ?? 0
              return (
                <motion.li
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ ...springs.soft, delay: i * 0.04 }}
                >
                  <GlassCard
                    interactive
                    radius="card"
                    padding="sm"
                    className="flex items-center gap-3 cursor-pointer"
                    role="button"
                    aria-label={`${member.name} — ${meta.label}`}
                  >
                    {/* Monochrome avatar tile — direction is icon + text, not color */}
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-sm font-semibold text-[var(--foreground)]">
                      {member.avatar}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--card-foreground)]">{member.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className="flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: meta.captionColor }}
                        >
                          <DirectionIcon direction={member.direction} />
                          {meta.label}
                        </span>
                        {sharedGroups > 0 && (
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            · {sharedGroups} {sharedGroups === 1 ? 'group' : 'groups'}
                          </span>
                        )}
                      </div>
                    </div>

                    <AnimatedAmount
                      value={member.netBalance}
                      className="shrink-0 text-sm font-bold tabular-nums"
                      style={{ color: meta.amountColor }}
                    />
                  </GlassCard>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      ) : (
        <GlassCard radius="card" padding="lg" animated className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold text-[var(--card-foreground)]">All settled up</p>
          <p className="text-xs text-[var(--muted-foreground)]">Nobody here — every balance is clear.</p>
        </GlassCard>
      )}
    </section>
  )
})