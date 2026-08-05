"use client"

import { DayTransactionList } from "@/src/features/transactions/components/day/day-transaction-list"
import { DayError, EmptyDay } from "@/src/features/transactions/components/day/empty-day"
import { LoadingDay } from "@/src/features/transactions/components/day/loading-day"
import { useDayTransactions } from "@/src/features/transactions/hooks/use-day-transactions"
import { formatDayHeading } from "@/src/features/transactions/utils/calendar-utils"
import { GlassCard, GlassCardDivider } from "@/src/shared/components/glass-card"
import { GlassWorkspace } from "@/src/shared/components/glass-workspace"
import { formatCurrency } from "@/src/shared/lib/format"
import { Calendar as CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import Link from "next/link"

const CURRENCY = "INR" as const

export default function DayTransactionsPage({ params }: { params: { date: string } }) {
    const router = useRouter()
    const { date } = params

    const { transactions, isLoading, isError, refetch } = useDayTransactions(date)

    const { incomeAmount, expenseAmount } = useMemo(() => {
        let income = 0
        let expense = 0
        for (const t of transactions) {
            if (t.type === "income" || t.type === "refund") income += t.amount
            else expense += t.amount
        }
        return { incomeAmount: income, expenseAmount: expense }
    }, [transactions])

    const handleClose = () => {
        router.back()
    }

    const actions = (
        <Link
            href={`/transactions/calendar?month=${date.slice(0, 7)}`}
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[var(--foreground)] transition-colors hover:bg-white/20"
            aria-label="Open calendar"
        >
            <CalendarIcon className="size-5" strokeWidth={1.75} />
        </Link>
    )

    return (
        <GlassWorkspace
            isOpen={true}
            onClose={handleClose}
            title={formatDayHeading(date)}
            actions={actions}
        >
            {isLoading ? (
                <LoadingDay />
            ) : isError ? (
                <DayError onRetry={refetch} />
            ) : (
                <>
                    <GlassCard radius="card" padding="md" className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-[var(--muted-foreground)]">Total</p>
                            <p className="text-base font-bold tabular-nums text-[var(--foreground)]">
                                {formatCurrency(expenseAmount, CURRENCY)}
                            </p>
                        </div>
                        <GlassCardDivider className="h-8 w-px" />
                        <div>
                            <p className="text-[11px] text-[var(--muted-foreground)]">Income</p>
                            <p className="text-base font-bold tabular-nums text-[var(--positive)]">
                                {formatCurrency(incomeAmount, CURRENCY)}
                            </p>
                        </div>
                        <GlassCardDivider className="h-8 w-px" />
                        <div>
                            <p className="text-[11px] text-[var(--muted-foreground)]">Expense</p>
                            <p className="text-base font-bold tabular-nums text-[var(--destructive)]">
                                {formatCurrency(expenseAmount, CURRENCY)}
                            </p>
                        </div>
                    </GlassCard>

                    <p className="text-sm font-semibold text-[var(--foreground)]">
                        {transactions.length} Transaction{transactions.length === 1 ? "" : "s"}
                    </p>

                    {transactions.length === 0 ? (
                        <EmptyDay />
                    ) : (
                        <GlassCard radius="cardLg" padding="none">
                            <DayTransactionList transactions={transactions} />
                        </GlassCard>
                    )}
                </>
            )}
        </GlassWorkspace>
    )
}