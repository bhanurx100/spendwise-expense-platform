"use client"

import { GlassCard, GlassCardDivider } from "@/src/shared/components/glass-card"
import { formatCurrency } from "@/src/shared/lib/format"
import type { Currency } from "@/src/types/transaction"
import { Receipt, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { memo } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// UpcomingPaymentsCard — replaces the old Accounts / Categories / SplitPay
// preview widgets on Overview. Per DESIGN_SYSTEM.md §04's anti-duplication
// rule, Overview only ever summarizes and deep-links — this card shows the
// next few payments and sends "See all" to a full payments list, it never repeats
// another page's complete breakdown inline.
//
// Row treatment matches GlassListItem: monochrome icon tile, label + due-date
// caption, trailing amount. Only a genuinely *overdue* payment gets
// --color-red text, and it carries an explicit "Overdue" label — never red
// alone (Section 21, color independence).
// ─────────────────────────────────────────────────────────────────────────────

export interface UpcomingPayment {
  id: string
  name: string
  icon: LucideIcon
  dueLabel: string
  amount: number
  overdue?: boolean
}

export const UpcomingPaymentsCard = memo(function UpcomingPaymentsCard({
  payments,
  currency,
}: {
  payments: UpcomingPayment[]
  currency: Currency
}) {
  return (
    <GlassCard radius="cardLg" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--foreground)]">Upcoming Payments</h2>
        <Link href="/accounts?tab=bills" className="text-sm font-semibold text-[var(--primary)]">
          See all
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
          No payments scheduled. You&apos;re all caught up.
        </p>
      ) : (
        <div className="flex flex-col">
          {payments.map((payment, i) => (
            <div key={payment.id}>
              {i > 0 && <GlassCardDivider className="my-3" />}
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
                  <payment.icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{payment.name}</p>
                  <p
                    className="truncate text-xs"
                    style={{ color: payment.overdue ? "var(--destructive)" : "var(--muted-foreground)" }}
                  >
                    {payment.overdue ? `Overdue · ${payment.dueLabel}` : payment.dueLabel}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-sm font-bold text-[var(--foreground)]">
                  {formatCurrency(payment.amount, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
})

export const defaultPaymentIcon = Receipt