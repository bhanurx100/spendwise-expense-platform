'use client'

import { GroupList } from '@/src/features/splitpay/components/home/group-list'
import { MemberList } from '@/src/features/splitpay/components/member/member-list'
import { SettleBanner } from '@/src/features/splitpay/components/home/settle-banner'
import { useSplitPay } from '@/src/features/splitpay/api/use-splitpay'
import { formatCurrency } from '@/src/shared/lib/format'
import { IconButton } from '@/src/shared/components/icon-button'
import { MobileShell } from '@/src/shared/components/mobile-shell'
import { PageHeader } from '@/src/shared/components/page-header'
import { QuickActions, type QuickAction } from '@/src/shared/components/quick-actions'
import { motion } from 'framer-motion'
import { Bell, HandCoins, Plus, Receipt, Search } from 'lucide-react'
import { useMemo } from 'react'

// NOTE: QuickActions' `tone` prop currently tints these tiles purple / cyan /
// orange at rest in the shared component (out of scope for this file, since
// its source isn't part of this pass). Per DESIGN_SYSTEM.md §13, every quick
// action tile must be monochrome at rest and tint only on press — flag
// QuickActions itself for the same fix applied here to GroupList/MemberList.
const quickActions: QuickAction[] = [
  { id: 'new-split', icon: Plus, label: 'New Split', hint: 'Any bill', tone: 'primary' },
  { id: 'settle', icon: HandCoins, label: 'Settle Up', hint: 'Via UPI', tone: 'primary' },
  { id: 'scan', icon: Receipt, label: 'Scan Bill', hint: 'Auto split', tone: 'primary' },
  { id: 'remind', icon: Bell, label: 'Remind', hint: 'Nudge friends', tone: 'primary' },
]

const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-30px' },
  transition: { type: 'spring' as const, stiffness: 220, damping: 26 },
}

export default function SplitPayPage() {
  const { data } = useSplitPay()
  const splitGroups = useMemo(() => data?.groups ?? [], [data?.groups])
  const splitMembers = useMemo(() => data?.members ?? [], [data?.members])
  // Net position — a summary strip, not a second GlassHero (Overview already
  // owns the app's one hero). Owed money is the only colored figure here.
  const { netAmount, isOwed, groupCount } = useMemo(() => {
    const totalOwed = splitGroups
      .filter((g) => g.status === 'you-are-owed')
      .reduce((sum, g) => sum + g.amount, 0)
    const totalOwing = splitGroups
      .filter((g) => g.status === 'you-owe')
      .reduce((sum, g) => sum + g.amount, 0)
    const net = totalOwed - totalOwing
    const activeGroups = splitGroups.filter((g) => g.status !== 'settled').length
    return { netAmount: Math.abs(net), isOwed: net >= 0, groupCount: activeGroups }
  }, [splitGroups])

  return (
    <MobileShell>
      <PageHeader
        title="SplitPay"
        subtitle="Simplify bills, split smartly"
        actions={
          <>
            <IconButton icon={Search} label="Search groups" />
            <IconButton icon={Bell} label="Notifications" />
          </>
        }
      />

      {/* Net position summary — text on canvas, not a boxed card (avoids a
          second hero competing with Overview's Net Worth hero). */}
      <motion.div {...sectionMotion} className="px-1">
        <p className="text-2xl font-bold tabular-nums" style={{ color: isOwed ? 'var(--positive)' : 'var(--foreground)' }}>
          {isOwed ? "You're owed " : 'You owe '}
          {formatCurrency(netAmount, 'INR')}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          across {groupCount} active {groupCount === 1 ? 'group' : 'groups'}
        </p>
      </motion.div>

      <motion.section aria-label="SplitPay quick actions" {...sectionMotion}>
        <QuickActions actions={quickActions} />
      </motion.section>

      <motion.div {...sectionMotion}>
        <SettleBanner />
      </motion.div>

      <motion.div {...sectionMotion}>
        <GroupList groups={splitGroups} />
      </motion.div>

      <motion.div {...sectionMotion}>
        <MemberList members={splitMembers} groups={splitGroups} />
      </motion.div>
    </MobileShell>
  )
}
