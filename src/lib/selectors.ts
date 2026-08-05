/**
 * Selectors — the single calculation source for the entire product.
 *
 * Every number shown on any screen is derived here from the raw entity
 * store (accounts + transactions + category metadata + split entities).
 * No component is allowed to invent metrics: pages import the derived
 * payloads fetched through the API, which are computed exclusively through
 * these functions. Change one transaction and every screen stays in sync.
 */

import type {
  AccountPreview,
  BalanceSummary,
  CashFlowPeriod,
  CashFlowPoint,
  CategorySummary,
  Currency,
  Insight,
  MonthGroup,
  MoneySummary,
  SplitGroup,
  SplitMember,
  SplitPaySummary,
  Transaction,
} from '@/src/types/transaction'

/* ── Date primitives (string-safe, no timezone drift) ─────────────────── */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface MonthRef {
  year: number
  month: number // 0-based
  key: string // 'YYYY-MM'
  label: string // 'July'
}

export function monthRefOf(isoDate: string): MonthRef {
  const year = Number(isoDate.slice(0, 4))
  const month = Number(isoDate.slice(5, 7)) - 1
  return { year, month, key: isoDate.slice(0, 7), label: MONTHS[month] }
}

/** The month the product treats as "now" — the latest month with activity. */
export function currentMonthOf(transactions: Transaction[]): MonthRef {
  let latest = '0000-00-00'
  for (const t of transactions) if (t.isoDate > latest) latest = t.isoDate
  return monthRefOf(latest)
}

function previousMonth(ref: MonthRef): MonthRef {
  const d = new Date(Date.UTC(ref.year, ref.month - 1, 1))
  return monthRefOf(d.toISOString().slice(0, 10))
}

/**
 * Period-aligned comparison: last month, but only up to the same day the
 * current month has reached. Prevents a partial month from looking like a
 * spending drop against a full previous month.
 */
function previousMonthToDate(transactions: Transaction[], ref: MonthRef): Transaction[] {
  const prev = previousMonth(ref)
  const latest = transactions.reduce((max, t) => (t.isoDate > max ? t.isoDate : max), '')
  const day = Number(latest.slice(8, 10))
  return monthTransactions(transactions, prev).filter((t) => Number(t.isoDate.slice(8, 10)) <= day)
}

function shiftDays(ref: MonthRef, day: number, delta: number): string {
  const d = new Date(Date.UTC(ref.year, ref.month, day + delta))
  return d.toISOString().slice(0, 10)
}

function shortLabel(isoDate: string): string {
  return `${Number(isoDate.slice(8, 10))} ${MONTHS[Number(isoDate.slice(5, 7)) - 1].slice(0, 3)}`
}

function daysInMonth(ref: MonthRef): number {
  return new Date(Date.UTC(ref.year, ref.month + 1, 0)).getUTCDate()
}

/* ── Flow totals — THE one definition of income / expense / net ────────── */

export interface FlowTotals {
  /** Everything coming in: income + refunds. */
  inflow: number
  /** Everything going out: expenses (transfers are internal, excluded). */
  outflow: number
  net: number
  incomeOnly: number
  expenseCount: number
  incomeCount: number
  transactionCount: number
}

export function flowTotals(transactions: Transaction[]): FlowTotals {
  let inflow = 0
  let outflow = 0
  let incomeOnly = 0
  let expenseCount = 0
  let incomeCount = 0
  let transactionCount = 0
  for (const t of transactions) {
    if (t.status === 'failed') continue
    transactionCount += 1
    if (t.type === 'expense') {
      outflow += t.amount
      expenseCount += 1
    } else if (t.type === 'income') {
      inflow += t.amount
      incomeOnly += t.amount
      incomeCount += 1
    } else if (t.type === 'refund') {
      inflow += t.amount
      incomeCount += 1
    }
    // transfers are internal account moves — never counted as flow
  }
  return { inflow, outflow, net: inflow - outflow, incomeOnly, expenseCount, incomeCount, transactionCount }
}

export function monthTransactions(transactions: Transaction[], ref: MonthRef): Transaction[] {
  return transactions.filter((t) => t.isoDate.startsWith(ref.key))
}

function monthOverMonth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/* ── Cash-flow series — real buckets for every period ──────────────────── */

function emptyTotals(): { inflow: number; outflow: number } {
  return { inflow: 0, outflow: 0 }
}

function bucketize(transactions: Transaction[]): Record<string, { inflow: number; outflow: number }> {
  const byDay: Record<string, { inflow: number; outflow: number }> = {}
  for (const t of transactions) {
    if (t.status === 'failed' || t.type === 'transfer') continue
    const bucket = byDay[t.isoDate] ?? (byDay[t.isoDate] = emptyTotals())
    if (t.type === 'expense') bucket.outflow += t.amount
    else bucket.inflow += t.amount
  }
  return byDay
}

/** Daily series for one month (days without activity included as zero). */
export function dailySeries(transactions: Transaction[], ref: MonthRef): CashFlowPoint[] {
  const byDay = bucketize(transactions)
  const latest = transactions.reduce((max, t) => (t.isoDate > max ? t.isoDate : max), '')
  const lastDay = latest.startsWith(ref.key) ? Number(latest.slice(8, 10)) : daysInMonth(ref)
  const points: CashFlowPoint[] = []
  for (let day = 1; day <= lastDay; day += 1) {
    const key = `${ref.key}-${String(day).padStart(2, '0')}`
    const b = byDay[key] ?? emptyTotals()
    points.push({ label: shortLabel(key), inflow: b.inflow, outflow: b.outflow, dateKey: key })
  }
  return points
}

/** Weekly series — trailing N weeks ending at the latest activity. */
export function weeklySeries(transactions: Transaction[], weeks: number): CashFlowPoint[] {
  const byDay = bucketize(transactions)
  const ref = currentMonthOf(transactions)
  const latestDay = transactions.reduce((max, t) => (t.isoDate > max ? t.isoDate : max), '')
  const end = latestDay
  const start = shiftDays(ref, Number(end.slice(8, 10)), -((weeks - 1) * 7) - (Number(end.slice(8, 10)) - 1))
  const points: CashFlowPoint[] = []
  for (let w = 0; w < weeks; w += 1) {
    const weekStart = shiftDays(monthRefOf(start), Number(start.slice(8, 10)), w * 7)
    let inflow = 0
    let outflow = 0
    for (let d = 0; d < 7; d += 1) {
      const key = shiftDays(monthRefOf(weekStart), Number(weekStart.slice(8, 10)), d)
      const b = byDay[key]
      if (b) {
        inflow += b.inflow
        outflow += b.outflow
      }
    }
    points.push({ label: shortLabel(weekStart), inflow, outflow, dateKey: weekStart.slice(0, 7) })
  }
  return points
}

/** Monthly series — trailing N months ending at the current month. */
export function monthlySeries(transactions: Transaction[], months: number): CashFlowPoint[] {
  const ref = currentMonthOf(transactions)
  const points: CashFlowPoint[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(ref.year, ref.month - i, 1))
    const m = monthRefOf(d.toISOString().slice(0, 10))
    const totals = flowTotals(monthTransactions(transactions, m))
    points.push({ label: m.label.slice(0, 3), inflow: totals.inflow, outflow: totals.outflow, dateKey: m.key })
  }
  return points
}

/** Full period map — the chart simply switches between real series. */
export function buildCashFlowByPeriod(
  transactions: Transaction[],
): Record<CashFlowPeriod, CashFlowPoint[]> {
  const ref = currentMonthOf(transactions)
  return {
    '1M': dailySeries(transactions, ref),
    '3M': weeklySeries(transactions, 13),
    '6M': weeklySeries(transactions, 26),
    '1Y': monthlySeries(transactions, 12),
  }
}

/* ── Sync status — derived from per-account provider timestamps ─────────── */

/** Parse relative sync labels like "2 min ago" into minutes elapsed. */
function parseSyncMinutes(label: string): number | null {
  if (!label || label === 'Manual') return null
  const min = label.match(/(\d+)\s*min/i)
  if (min) return Number(min[1])
  const hr = label.match(/(\d+)\s*hr/i)
  if (hr) return Number(hr[1]) * 60
  return null
}

function formatSyncLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hrs = Math.round(minutes / 60)
  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
}

/** Most recent provider sync across real (non-linked) accounts. */
export function buildLastSyncedLabel(accounts: AccountPreview[]): string {
  const real = accounts.filter((a) => !a.linkedAccountId && a.lastSynced)
  const minutes = real
    .map((a) => parseSyncMinutes(a.lastSynced!))
    .filter((m): m is number => m !== null)
  if (minutes.length === 0) return 'Manual entry'
  return formatSyncLabel(Math.min(...minutes))
}

/* ── Headline summaries ────────────────────────────────────────────────── */

/**
 * Net-worth convention:
 *  - bank / wallet / cash / investment balances count positively
 *  - credit-card balances are dues and subtract from the total
 *  - linked instruments (debit cards) mirror their bank account and are
 *    never counted — counting them would double-count the same money
 */
export function buildBalanceSummary(
  accounts: AccountPreview[],
  transactions: Transaction[],
  currency: Currency,
): BalanceSummary {
  const ref = currentMonthOf(transactions)
  const real = accounts.filter((a) => !a.linkedAccountId)
  const creditOutstanding = real
    .filter((a) => a.type === 'credit-card')
    .reduce((sum, a) => sum + a.balance, 0)
  const totalBalance = real.reduce((sum, a) => {
    return a.type === 'credit-card' ? sum - a.balance : sum + a.balance
  }, 0)
  const { net } = flowTotals(monthTransactions(transactions, ref))
  const opening = totalBalance - net
  return {
    totalBalance,
    monthlyChange: net,
    monthlyChangePercent: opening > 0 ? Math.round((net / opening) * 1000) / 10 : 0,
    accountCount: real.length,
    creditOutstanding,
    lastSyncedLabel: buildLastSyncedLabel(accounts),
    currency,
  }
}

export function buildMoneySummary(transactions: Transaction[], currency: Currency): MoneySummary {
  const ref = currentMonthOf(transactions)
  const totals = flowTotals(monthTransactions(transactions, ref))
  const series = dailySeries(transactions, ref)
  return {
    moneyIn: totals.inflow,
    moneyOut: totals.outflow,
    netBalance: totals.net,
    inBars: series.map((p) => p.inflow),
    outBars: series.map((p) => p.outflow),
    netBars: series.map((p) => p.inflow - p.outflow),
    currency,
  }
}


/* ── Month groups (timeline) ───────────────────────────────────────────── */

export function buildMonthGroups(transactions: Transaction[], currency: Currency): MonthGroup[] {
  const keys: string[] = []
  for (const t of transactions) {
    const key = t.isoDate.slice(0, 7)
    if (!keys.includes(key)) keys.push(key)
  }
  keys.sort().reverse()
  return keys.map((key) => {
    const ref = monthRefOf(`${key}-01`)
    const txns = monthTransactions(transactions, ref).sort((a, b) =>
      b.isoDate === a.isoDate ? b.id.localeCompare(a.id) : b.isoDate < a.isoDate ? -1 : 1,
    )
    return {
      id: key,
      month: ref.label,
      year: ref.year,
      totalSpent: flowTotals(txns).outflow,
      currency,
      transactions: txns,
    }
  })
}

/** Every month with activity, newest first — drives month switchers. */
export function listMonths(transactions: Transaction[]): MonthRef[] {
  const keys: string[] = []
  for (const t of transactions) {
    const key = t.isoDate.slice(0, 7)
    if (!keys.includes(key)) keys.push(key)
  }
  keys.sort().reverse()
  return keys.map((k) => monthRefOf(`${k}-01`))
}

function resolveMonth(transactions: Transaction[], key?: string): MonthRef {
  return key ? monthRefOf(`${key}-01`) : currentMonthOf(transactions)
}

/** Comparison window for a month: to-date when it's the live month, full previous month otherwise. */
function comparisonWindow(transactions: Transaction[], ref: MonthRef): Transaction[] {
  const current = currentMonthOf(transactions)
  if (ref.key === current.key) return previousMonthToDate(transactions, ref)
  return monthTransactions(transactions, previousMonth(ref))
}

/* ── Categories — totals always equal the real expense sum ─────────────── */

export interface CategoryMeta {
  id: string
  name: string
  icon: string
  budget?: number
  group?: CategorySummary['group']
}

export function buildCategorySummaries(
  transactions: Transaction[],
  meta: CategoryMeta[],
  monthKey?: string,
): CategorySummary[] {
  const ref = resolveMonth(transactions, monthKey)
  const thisMonth = monthTransactions(transactions, ref)
  const lastMonth = comparisonWindow(transactions, ref)
  const totalOut = flowTotals(thisMonth).outflow

  return meta
    .map((c) => {
      const txns = thisMonth.filter((t) => t.type === 'expense' && t.category === c.name)
      const amount = txns.reduce((sum, t) => sum + t.amount, 0)
      const lastAmount = lastMonth
        .filter((t) => t.type === 'expense' && t.category === c.name)
        .reduce((sum, t) => sum + t.amount, 0)
      const merchants: string[] = []
      for (const t of txns) if (!merchants.includes(t.subtitle)) merchants.push(t.subtitle)
      
      // Calculate highest spend
      let highestSpend: { amount: number; merchant: string } | undefined
      if (txns.length > 0) {
        const highest = txns.reduce((max, t) => (t.amount > max.amount ? t : max), txns[0])
        highestSpend = { amount: highest.amount, merchant: highest.merchant }
      }
      
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        // color: c.color,
        budget: c.budget,
        group: c.group,
        amount,
        percent: totalOut > 0 ? Math.round((amount / totalOut) * 1000) / 10 : 0,
        trend: monthOverMonth(amount, lastAmount),
        merchantCount: merchants.length,
        transactionCount: txns.length,
        highestSpend,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/** Aggregate category summaries across multiple months for period filtering */
export function buildCategorySummariesForPeriod(
  transactions: Transaction[],
  meta: CategoryMeta[],
  period: '1M' | '3M' | '6M' | '1Y' | 'All',
): CategorySummary[] {
  const current = currentMonthOf(transactions)
  const allMonths = listMonths(transactions)
  const monthsToInclude = period === 'All' 
    ? allMonths.length 
    : period === '1M' ? 1 
    : period === '3M' ? 3 
    : period === '6M' ? 6 
    : 12
  
  const includedMonths: MonthRef[] = []
  for (let i = 0; i < Math.min(monthsToInclude, allMonths.length); i++) {
    const d = new Date(Date.UTC(current.year, current.month - i, 1))
    includedMonths.push(monthRefOf(d.toISOString().slice(0, 10)))
  }
  
  // Aggregate transactions across all included months
  const periodTransactions: Transaction[] = []
  for (const monthRef of includedMonths) {
    periodTransactions.push(...monthTransactions(transactions, monthRef))
  }
  
  // Calculate previous period for trend comparison
  const previousPeriodTransactions: Transaction[] = []
  for (let i = monthsToInclude; i < monthsToInclude * 2; i++) {
    const d = new Date(Date.UTC(current.year, current.month - i, 1))
    const monthRef = monthRefOf(d.toISOString().slice(0, 10))
    if (allMonths.some(m => m.key === monthRef.key)) {
      previousPeriodTransactions.push(...monthTransactions(transactions, monthRef))
    }
  }
  
  const totalOut = flowTotals(periodTransactions).outflow
  const lastOut = flowTotals(previousPeriodTransactions).outflow
  
  return meta
    .map((c) => {
      const txns = periodTransactions.filter((t) => t.type === 'expense' && t.category === c.name)
      const amount = txns.reduce((sum, t) => sum + t.amount, 0)
      const lastAmount = previousPeriodTransactions
        .filter((t) => t.type === 'expense' && t.category === c.name)
        .reduce((sum, t) => sum + t.amount, 0)
      const merchants: string[] = []
      for (const t of txns) if (!merchants.includes(t.subtitle)) merchants.push(t.subtitle)
      
      // Calculate highest spend
      let highestSpend: { amount: number; merchant: string } | undefined
      if (txns.length > 0) {
        const highest = txns.reduce((max, t) => (t.amount > max.amount ? t : max), txns[0])
        highestSpend = { amount: highest.amount, merchant: highest.merchant }
      }
      
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        //color: c.color,
        budget: c.budget,
        group: c.group,
        amount,
        percent: totalOut > 0 ? Math.round((amount / totalOut) * 1000) / 10 : 0,
        trend: monthOverMonth(amount, lastAmount),
        merchantCount: merchants.length,
        transactionCount: txns.length,
        highestSpend,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/* ── SplitPay — summary derived from member settlements ────────────────── */

export function buildSplitSummary(
  members: SplitMember[],
  groups: SplitGroup[],
  currency: Currency,
): SplitPaySummary {
  const youOwe = members
    .filter((m) => m.direction === 'you-owe')
    .reduce((sum, m) => sum + m.netBalance, 0)
  const youAreOwed = members
    .filter((m) => m.direction === 'owes-you')
    .reduce((sum, m) => sum + m.netBalance, 0)
  return {
    youOwe,
    youAreOwed,
    netBalance: youAreOwed - youOwe,
    oweGroups: groups.filter((g) => g.status === 'you-owe').length,
    owedGroups: groups.filter((g) => g.status === 'you-are-owed').length,
    currency,
  }
}

/* ── Dynamic insights — generated from real activity, never predefined ─── */

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/**
 * Insight engine. Every candidate is computed from the transaction store;
 * the ranking decides what surfaces first. When the data changes, the
 * insights change — nothing here is a predefined string.
 */
export function buildInsights(
  transactions: Transaction[],
  meta: CategoryMeta[],
): Insight[] {
  const ref = currentMonthOf(transactions)
  const thisMonth = monthTransactions(transactions, ref)
  const lastMonth = previousMonthToDate(transactions, ref)
  const categories = buildCategorySummaries(transactions, meta)
  const current = flowTotals(thisMonth)
  const last = flowTotals(lastMonth)
  const insights: Insight[] = []

  // 1 — Biggest category right now
  const top = categories[0]
  if (top && top.amount > 0) {
    insights.push({
      id: 'top-category',
      icon: 'crown',
      title: 'Top spending category',
      description: `${top.name} leads your spending at ${inr(top.amount)} — ${top.percent}% of this month's outflow.`,
      cta: 'View categories',
      href: `/categories?category=${top.id}`,
      tone: 'info',
    })
  }

  // 2 — Biggest month-over-month increase
  const increases = categories
    .map((c) => ({ c, delta: c.amount - lastAmountOf(lastMonth, c.name) }))
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
  const spike = increases[0]
  if (spike && spike.delta >= 500) {
    insights.push({
      id: 'biggest-increase',
      icon: 'trending-up',
      title: 'Spending spike',
      description: `${spike.c.name} is up ${inr(spike.delta)} vs last month${(spike.c.trend ?? 0) > 0 ? ` (+${spike.c.trend}%)` : ''} — worth a look.`,
      cta: 'Inspect category',
      href: `/categories?category=${spike.c.id}`,
      tone: 'warning',
    })
  }

  // 3 — Biggest saving vs last month
  const decreases = categories
    .map((c) => ({ c, delta: lastAmountOf(lastMonth, c.name) - c.amount }))
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
  const saved = decreases[0]
  if (saved && saved.delta > 0) {
    insights.push({
      id: 'biggest-saving',
      icon: 'piggy-bank',
      title: 'Spending Insight',
      description: `You spent ${inr(saved.delta)} less on ${saved.c.name} compared to last month.`,
      cta: 'View details',
      href: `/categories?category=${saved.c.id}`,
      tone: 'positive',
    })
  }

  // 4 — Most active merchant this month
  const merchantCounts: Record<string, number> = {}
  for (const t of thisMonth) {
    if (t.type !== 'expense') continue
    merchantCounts[t.subtitle] = (merchantCounts[t.subtitle] ?? 0) + 1
  }
  const merchants = Object.keys(merchantCounts).sort(
    (a, b) => merchantCounts[b] - merchantCounts[a],
  )
  const frequent = merchants[0]
  if (frequent && merchantCounts[frequent] >= 3) {
    insights.push({
      id: 'top-merchant',
      icon: 'flame',
      title: 'Most visited merchant',
      description: `${frequent} appeared ${merchantCounts[frequent]} times this month — your most frequent spend.`,
      cta: 'See transactions',
      href: '/transactions?type=expense',
      tone: 'info',
    })
  }

  // 5 — Largest single transaction
  const expenses = thisMonth.filter((t) => t.type === 'expense')
  const largest = expenses.reduce<Transaction | null>(
    (max, t) => (max === null || t.amount > max.amount ? t : max),
    null,
  )
  if (largest) {
    insights.push({
      id: 'largest-expense',
      icon: 'zap',
      title: 'Largest expense',
      description: `${largest.merchant} at ${inr(largest.amount)} on ${shortLabel(largest.isoDate)} was your biggest single expense this month.`,
      cta: 'Review transaction',
      href: '/transactions?type=expense',
      tone: 'negative',
    })
  }

  // 6 — Budget warnings
  const overBudget = categories.find((c) => c.budget !== undefined && c.amount > c.budget)
  if (overBudget && overBudget.budget !== undefined) {
    insights.push({
      id: 'budget-warning',
      icon: 'alert-triangle',
      title: 'Budget exceeded',
      description: `${overBudget.name} crossed its ${inr(overBudget.budget)} budget by ${inr(overBudget.amount - overBudget.budget)}.`,
      cta: 'Adjust budget',
      href: `/categories?category=${overBudget.id}`,
      tone: 'warning',
    })
  }

  // 7 — Savings trend
  if (current.net > 0 && current.net > last.net) {
    insights.push({
      id: 'savings-trend',
      icon: 'sparkles',
      title: 'Savings improving',
      description: `You kept ${inr(current.net)} this month — ${inr(current.net - last.net)} more than last month. Keep going.`,
      cta: 'View cash flow',
      href: '/transactions',
      tone: 'positive',
    })
  }

  // 8 — Top income source
  const incomeCounts: Record<string, number> = {}
  for (const t of thisMonth) {
    if (t.type !== 'income') continue
    incomeCounts[t.subtitle] = (incomeCounts[t.subtitle] ?? 0) + t.amount
  }
  const sources = Object.keys(incomeCounts).sort((a, b) => incomeCounts[b] - incomeCounts[a])
  const topSource = sources[0]
  if (topSource) {
    insights.push({
      id: 'top-income',
      icon: 'briefcase',
      title: 'Primary income source',
      description: `${topSource} brought in ${inr(incomeCounts[topSource])} — your largest income stream this month.`,
      cta: 'View income',
      href: '/transactions?type=income',
      tone: 'positive',
    })
  }

  return insights
}

function lastAmountOf(transactions: Transaction[], category: string): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.category === category)
    .reduce((sum, t) => sum + t.amount, 0)
}

/* ── Account insights — derived from per-account activity ──────────────── */

export function buildAccountInsights(
  accounts: AccountPreview[],
  transactions: Transaction[],
): Insight[] {
  const ref = currentMonthOf(transactions)
  const thisMonth = monthTransactions(transactions, ref)
  const latest = transactions.reduce((max, t) => (t.isoDate > max ? t.isoDate : max), '')
  const insights: Insight[] = []

  // Most active account this month
  const activity: Record<string, number> = {}
  for (const t of thisMonth) activity[t.account] = (activity[t.account] ?? 0) + 1
  const names = Object.keys(activity).sort((a, b) => activity[b] - activity[a])
  const busiest = names[0]
  if (busiest) {
    insights.push({
      id: 'busiest-account',
      icon: 'sparkles',
      title: 'Most active account',
      description: `${busiest} handled ${activity[busiest]} transactions this month — your primary money hub.`,
      tone: 'positive',
    })
  }

  // Idle accounts with a balance (no activity in 7+ days)
  for (const account of accounts) {
    if (account.linkedAccountId) continue // mirrored cards can't go idle
    const accountTxns = transactions.filter((t) => t.account === account.institution)
    const lastSeen = accountTxns.reduce((max, t) => (t.isoDate > max ? t.isoDate : max), '')
    if (account.balance > 0 && lastSeen !== '' && daysBetween(lastSeen, latest) >= 7) {
      insights.push({
        id: `idle-${account.id}`,
        icon: 'wallet',
        title: `${account.institution} inactive`,
        description: `No activity for ${daysBetween(lastSeen, latest)} days — ${inr(account.balance)} is sitting idle.`,
        tone: 'warning',
      })
      break
    }
  }

  // Largest expense account this month
  const spendByAccount: Record<string, number> = {}
  for (const t of thisMonth) {
    if (t.type !== 'expense') continue
    spendByAccount[t.account] = (spendByAccount[t.account] ?? 0) + t.amount
  }
  const spenders = Object.keys(spendByAccount).sort((a, b) => spendByAccount[b] - spendByAccount[a])
  const topSpender = spenders[0]
  if (topSpender) {
    insights.push({
      id: 'top-spender',
      icon: 'credit-card',
      title: 'Highest spending account',
      description: `${topSpender} saw ${inr(spendByAccount[topSpender])} go out this month — more than any other account.`,
      tone: 'info',
    })
  }

  return insights
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/* ── Categories page headline — same totals as the category list ───────── */

export function buildCategoryPageSummary(
  transactions: Transaction[],
  currency: Currency,
  monthKey?: string,
): { totalSpent: number; changePercent: number; month: string; currency: Currency } {
  const ref = resolveMonth(transactions, monthKey)
  const current = flowTotals(monthTransactions(transactions, ref))
  const last = flowTotals(comparisonWindow(transactions, ref))
  return {
    totalSpent: current.outflow,
    changePercent: monthOverMonth(current.outflow, last.outflow),
    month: `${ref.label} ${ref.year}`,
    currency,
  }
}

/* ── Per-account monthly net flow (drives account detail footnotes) ────── */

export function accountMonthlyNet(transactions: Transaction[], accountName: string): number {
  const ref = currentMonthOf(transactions)
  return monthTransactions(transactions, ref)
    .filter((t) => t.account === accountName)
    .reduce((net, t) => {
      if (t.type === 'expense') return net - t.amount
      if (t.type === 'income' || t.type === 'refund') return net + t.amount
      return net
    }, 0)
}
