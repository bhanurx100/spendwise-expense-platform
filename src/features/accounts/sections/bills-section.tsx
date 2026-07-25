'use client'

import { UpcomingPaymentsCard, type UpcomingPayment } from '@/src/features/dashboard/sections/upcoming-bills-card'
import type { Bill } from '@/src/types/transaction'

export function BillsSection({ bills }: { bills: Bill[] }) {
  // Convert Bill[] to UpcomingPayment[] format
  const payments: UpcomingPayment[] = bills.map((bill) => ({
    id: bill.id,
    name: bill.name,
    icon: bill.icon as any, // LucideIcon
    dueLabel: bill.dueLabel,
    amount: bill.amount,
    overdue: bill.overdue,
  }))

  return (
    <section aria-label="Upcoming payments" className="flex flex-col gap-4">
      <UpcomingPaymentsCard payments={payments} currency="INR" />
    </section>
  )
}
