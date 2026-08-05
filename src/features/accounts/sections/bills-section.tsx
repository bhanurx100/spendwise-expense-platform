'use client'

import { UpcomingPaymentsCard, type UpcomingPayment } from '@/src/features/dashboard/sections/upcoming-bills-card'
import type { Bill } from '@/src/types/transaction'
import { FileText, Wifi, CreditCard, Smartphone, Play } from 'lucide-react'

// Map icon strings to LucideIcon components
const iconMap: Record<string, any> = {
  'file-text': FileText,
  'wifi': Wifi,
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'play': Play,
}

export function BillsSection({ bills }: { bills: Bill[] }) {
  // Convert Bill[] to UpcomingPayment[] format
  const payments: UpcomingPayment[] = bills.map((bill) => ({
    id: bill.id,
    name: bill.name,
    icon: iconMap[bill.icon] || FileText,
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
