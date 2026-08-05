"use client"
import { Suspense } from "react"
import { OverviewHeader } from "@/src/features/dashboard/components/overview-header"
import { HeroCard } from "@/src/features/dashboard/components/hero-card"
import { CashFlowCard } from "@/src/features/dashboard/sections/cash-flow-card"
import { UpcomingPaymentsCard } from "@/src/features/dashboard/sections/upcoming-bills-card"
import { useFinancialView } from '@/src/features/dashboard/api/use-financial-view'
import { QuickActions, type QuickAction } from "@/src/shared/components/quick-actions"
import { MobileShell } from "@/src/shared/components/mobile-shell"
import { motion } from "framer-motion"
import {
  CreditCard,
  Plus,
  ScanLine,
  Sparkles,
} from "lucide-react"

const quickActions: QuickAction[] = [
  { id: "add", icon: Plus, label: "Add Money", hint: "Any account", tone: "primary", href: "/accounts" },
  { id: "scan", icon: ScanLine, label: "Scan Bill", hint: "Auto capture", tone: "info", href: "/transactions?action=scan" },
  { id: "split", icon: CreditCard, label: "Split", hint: "With friends", tone: "warning", href: "/splitpay" },
  { id: "insights", icon: Sparkles, label: "Insights", hint: "Spend smart", tone: "primary", href: "/categories" },
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { type: "spring" as const, stiffness: 200, damping: 26 },
}

function OverviewContent() {
  const { balance, cashFlow, insight, dashboardMetrics, isLoading } = useFinancialView()
  const greeting = { name: 'there', subtitle: '', unreadNotifications: 0 }

  if (isLoading) return <MobileShell><p className="py-12 text-center text-sm text-[var(--muted-foreground)]">Loading your finances…</p></MobileShell>
  return (
    <MobileShell>
      <OverviewHeader greeting={greeting} />

      {/* One GlassContainer for the page's floating-card section, per
          GlassCard.tsx's own usage example — spotlight cards nest inside
          it fine, containers just never nest inside each other. */}

      <motion.div {...sectionMotion}>
        <HeroCard
          summary={balance}
          greeting={greeting}
          insight={insight.description}
          metrics={dashboardMetrics}
        />
      </motion.div>

      <motion.section aria-label="Quick actions" {...sectionMotion}>
        <QuickActions actions={quickActions} />
      </motion.section>

      <motion.div {...sectionMotion}>
        <CashFlowCard seriesByPeriod={cashFlow} currency={balance.currency} />
      </motion.div>

      <motion.div {...sectionMotion}>
        <UpcomingPaymentsCard payments={[]} currency={balance.currency} />
      </motion.div>
    </MobileShell>
  )
}

export default function OverviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" aria-hidden="true" />
      </div>
    }>
      <OverviewContent />
    </Suspense>
  )
}
