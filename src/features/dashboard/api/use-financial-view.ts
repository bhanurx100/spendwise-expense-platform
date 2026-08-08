'use client'

/**
 * View-model hooks for the legacy presentation components.  This is the
 * boundary between API entities and the shapes those components render: it
 * contains no fixture data and every value is derived from React Query data.
 */
import { useMemo } from 'react'
import { format } from 'date-fns'
import { useGetAccounts } from '@/src/features/accounts/api/use-get-accounts'
import { useGetCategories } from '@/src/features/categories/api/use-get-categories'
import { useGetSummary } from '@/src/features/summary/api/use-get-summary'
import { useGetTransactions } from '@/src/features/transactions/api/use-get-transactions'
import { mapTransactionRow } from '@/src/features/transactions/lib/map-transaction'
import type { AccountDetails, AccountPreview, BalanceSummary, CategorySummary, CashFlowPeriod, Insight, MonthGroup, Transaction } from '@/src/types/transaction'

const currency = 'INR' as const


export type FinancialViewRange = { from?: string; to?: string }

/**
 * `range` is optional. When omitted, summary/transactions read date
 * filters from the URL as before. Pass an explicit `{ from, to }` (e.g.
 * derived from a period selector like 1M/3M/6M/1Y/All) to scope this view
 * to a specific window without touching the URL — this is what makes
 * period selectors on pages like Categories actually affect the data
 * shown, instead of only updating local UI state.
 */
export function useFinancialView(range?: FinancialViewRange) {
  const summary = useGetSummary(range)
  const transactions = useGetTransactions(range)
  const accounts = useGetAccounts()
  const categories = useGetCategories()

  return useMemo(() => {
    const txs = (transactions.data ?? []).map(mapTransactionRow)
    const accountRows = accounts.data ?? []
    // `row.balance` is the single source of truth computed server-side by
    // balance-service (openingBalance + all-time transaction sum). Do NOT
    // re-derive balance from `transactions.data` here — that list is
    // date-windowed (defaults to last 30 days) and would silently disagree
    // with the real balance the moment older transactions exist.
    const accountViews: AccountPreview[] = accountRows.map((row) => ({
      id: row.id, name: row.name, institution: row.institution, type: row.type as AccountPreview['type'],
      balance: row.balance,
      monthlyChangePercent: 0, currency,
      maskedNumber: row.maskedNumber ?? undefined,
      isPrimary: row.isPrimary,
      linkedAccountId: row.linkedAccountId ?? undefined,
    }))
    const creditOutstanding = accountViews
      .filter((account) => account.type === 'credit-card')
      .reduce((sum, account) => sum + Math.max(0, -account.balance), 0)
    const balance: BalanceSummary = {
      // `row.balance` from balance-repository is already correctly signed
      // (negative = money owed, for both regular overdrafts and credit
      // cards) — it is NOT a magnitude that needs per-type sign-flipping.
      // Net Worth is simply the sum of every account's balance, matching
      // Phase 1.3 Part 3 ("Net Worth must equal the sum of current account
      // balances") exactly, with no separate re-derivation anywhere else.
      totalBalance: accountViews.reduce((total, account) => total + account.balance, 0),
      monthlyChange: summary.data?.remainingChange ?? 0, monthlyChangePercent: summary.data?.remainingChange ?? 0,
      accountCount: accountViews.length, creditOutstanding, lastSyncedLabel: 'Manual entry', currency,
      availableToSpend: accountViews.reduce((total, account) => total + account.balance, 0),
    }
    const daysWithExpenses = (summary.data?.days ?? []).filter((day) => day.expenses > 0).length
    const dashboardMetrics = {
      availableToSpend: balance.availableToSpend ?? 0,
      savingsRate: summary.data && summary.data.incomeAmount > 0
        ? (summary.data.incomeAmount - summary.data.expensesAmount) / summary.data.incomeAmount * 100 : null,
      dailyBurn: daysWithExpenses ? (summary.data?.expensesAmount ?? 0) / daysWithExpenses : 0,
      monthlyChange: balance.monthlyChange,
      monthlyChangePercent: balance.monthlyChangePercent,
    }
    const categoryTotals = new Map<string, { id: string; name: string; amount: number; count: number }>()
    for (const row of transactions.data ?? []) if (row.amount < 0) {
      const id = row.categoryId ?? 'uncategorized'
      const current = categoryTotals.get(id) ?? { id, name: row.category ?? 'Uncategorized', amount: 0, count: 0 }
      current.amount += Math.abs(row.amount); current.count += 1; categoryTotals.set(id, current)
    }
    const categoryTotalsList = Array.from(categoryTotals.values())
    const totalSpend = categoryTotalsList.reduce((sum, item) => sum + item.amount, 0)
    const categoryViews: CategorySummary[] = categoryTotalsList.map((item) => ({
      ...item, icon: 'receipt', percent: totalSpend ? Math.round((item.amount / totalSpend) * 100) : 0, transactionCount: item.count,
    }))
    const groups = new Map<string, Transaction[]>()
    for (const tx of txs) { const key = tx.isoDate.slice(0, 7); groups.set(key, [...(groups.get(key) ?? []), tx]) }
    const monthGroups: MonthGroup[] = Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a)).map(([key, rows]) => ({
      id: key, month: format(new Date(`${key}-01T00:00:00`), 'MMMM'), year: Number(key.slice(0, 4)),
      totalSpent: rows.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0), currency, transactions: rows,
    }))
    // Cash flow is derived from the same /api/summary `days` series — no mock data.
    const cashFlow = (['1M', '3M', '6M', '1Y'] as CashFlowPeriod[]).reduce((result, period) => {
      const now = new Date()
      const periodMap: Record<CashFlowPeriod, Date> = {
        '1M': new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        '3M': new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
        '6M': new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
        '1Y': new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      }
      const cutoffDate = periodMap[period]
      const filteredDays = (summary.data?.days ?? []).filter((day) => {
        const dayDate = new Date(day.date)
        return !Number.isNaN(dayDate.getTime()) && dayDate >= cutoffDate
      })
      result[period] = filteredDays.map((day) => ({
        dateKey: day.date.slice(0, 10),
        label: format(new Date(day.date), 'd MMM'),
        inflow: day.income,
        outflow: day.expenses,
      }))
      return result
    }, {} as Record<CashFlowPeriod, { dateKey: string; label: string; inflow: number; outflow: number }[]>)
    const insight: Insight = categoryViews.length ? {
      id: categoryViews[0].id, icon: categoryViews[0].icon, title: `${categoryViews[0].name} is your largest expense`,
      description: `${categoryViews[0].percent}% of spending in the selected period.`, tone: 'info', href: '/transactions',
    } : { id: 'empty', icon: 'receipt', title: 'No spending data yet', description: 'Add transactions to see insights.', tone: 'info' }
    const details = new Map<string, AccountDetails>(accountViews.map((account) => [account.id, {
      accountId: account.id, fields: [{ id: 'name', label: 'Account', value: account.name, icon: 'wallet' }],
      primaryAmountLabel: 'Current balance', primaryAmount: account.type === 'credit-card' ? Math.abs(account.balance) : account.balance, secondaryAmountLabel: 'Transactions',
      secondaryAmount: txs.filter((tx) => tx.account === account.name).length, progressPercent: 0,
      footnoteLabel: 'Data source', footnoteValue: 'Manual entry', currency,
    }]))
    return { balance, dashboardMetrics, accountViews, categoryViews, monthGroups, cashFlow, insight, details, isLoading: summary.isLoading || transactions.isLoading || accounts.isLoading || categories.isLoading }
  }, [accounts.data, summary.data, summary.isLoading, transactions.data, transactions.isLoading, accounts.isLoading, categories.isLoading])
}