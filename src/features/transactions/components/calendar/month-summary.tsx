"use client"

import { GlassCard, GlassCardDivider } from "@/src/shared/components/glass-card"
import { formatCurrency } from "@/src/shared/lib/format"
import type { Currency } from "@/src/types/transaction"
import type { MonthTotals } from "../../hooks/use-month-aggregation"

export function MonthSummary({ totals, currency }: { totals: MonthTotals; currency: Currency }) {
    return (
        <GlassCard radius="card" padding="md" className="flex items-center justify-between">
            <div>
                <p className="text-[11px] text-[var(--muted-foreground)]">Total Spent</p>
                <p className="text-base font-bold tabular-nums text-[var(--foreground)]">
                    {formatCurrency(totals.expenseAmount, currency)}
                </p>
            </div>
            <GlassCardDivider className="h-8 w-px" />
            <div>
                <p className="text-[11px] text-[var(--muted-foreground)]">Income</p>
                <p className="text-base font-bold tabular-nums text-[var(--positive)]">
                    {formatCurrency(totals.incomeAmount, currency)}
                </p>
            </div>
            <GlassCardDivider className="h-8 w-px" />
            <div>
                <p className="text-[11px] text-[var(--muted-foreground)]">Expense</p>
                <p className="text-base font-bold tabular-nums text-[var(--destructive)]">
                    {formatCurrency(totals.expenseAmount, currency)}
                </p>
            </div>
        </GlassCard>
    )
}