"use client"

import { OverviewHeader } from "@/src/features/dashboard/components/overview-header"
import { HeroCard } from "@/src/features/dashboard/components/hero-card"
import { CashFlowCard } from "@/src/features/dashboard/sections/cash-flow-card"
import { UpcomingPaymentsCard, defaultPaymentIcon } from "@/src/features/dashboard/sections/upcoming-bills-card"
import { balanceSummary, cashFlowByPeriod, greeting } from "@/src/lib/data"
import { MobileShell } from "@/src/shared/components/mobile-shell"
import { motion } from "framer-motion"
import {
  CreditCard,
  Wifi,
} from "lucide-react"

const upcomingPayments = [
  { id: "b1", name: "Electricity Board", icon: defaultPaymentIcon, dueLabel: "Due tomorrow", amount: 2140 },
  { id: "b2", name: "Broadband — ACT Fibernet", icon: Wifi, dueLabel: "Due in 4 days", amount: 999 },
  { id: "b3", name: "Credit Card — HDFC", icon: CreditCard, dueLabel: "Due 2 Jul", amount: 12480, overdue: true },
]

const sectionMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-30px" },
  transition: { type: "spring" as const, stiffness: 200, damping: 26 },
}

export default function OverviewPage() {
  return (
    <MobileShell>
      <OverviewHeader greeting={greeting} />

      <motion.div {...sectionMotion}>
        <HeroCard
          summary={balanceSummary}
          greeting={greeting}
          insight="You're spending 14% less than last month. Great job keeping your finances in control!"
        />
      </motion.div>

      <motion.div {...sectionMotion}>
        <CashFlowCard seriesByPeriod={cashFlowByPeriod} currency={balanceSummary.currency} />
      </motion.div>

      <motion.div {...sectionMotion}>
        <UpcomingPaymentsCard payments={upcomingPayments} currency={balanceSummary.currency} />
      </motion.div>
    </MobileShell>
  )
}