/**
 * SplitFin entity store — the ONLY place mock content lives.
 *
 * Everything on every screen is derived from these raw entities through
 * `@/src/lib/selectors`. Summary payloads below are computed, never
 * written by hand: change one transaction and the Overview, Transactions,
 * Categories, Accounts and SplitPay pages all stay in sync. In production
 * these entities arrive from typed service hooks — components never own
 * data, they only receive derived props.
 */

import {
  accountMonthlyNet,
  buildAccountInsights,
  buildBalanceSummary,
  buildCashFlowByPeriod,
  buildCategoryPageSummary,
  buildCategorySummaries,
  buildCategorySummariesForPeriod,
  buildInsights,
  buildMonthGroups,
  buildMoneySummary,
  buildSplitSummary,
  listMonths,
  type CategoryMeta,
} from '@/src/lib/selectors'
import type {
  AccountDetails,
  AccountPreview,
  Bill,
  PortfolioSummary,
  SplitGroup,
  SplitMember,
  Transaction,
  UserGreeting,
} from '@/src/types/transaction'

/* ── User ──────────────────────────────────────────────────────────────── */

export const greeting: UserGreeting = {
  name: 'Bhanurx100',
  subtitle: 'Take control, split smart, save more.',
  unreadNotifications: 3,
}

/* ── Accounts — current balances are manual-entry state ────────────────── */

export const accounts: AccountPreview[] = [
  {
    id: 'hdfc',
    name: 'Savings Account',
    institution: 'HDFC Bank',
    type: 'bank',
    balance: 284500,
    monthlyChangePercent: 8.2,
    currency: 'INR',
    accountsCount: 3,
    isPrimary: true,
    maskedNumber: '•••• 4821',
    lastSynced: '2 min ago',
  },
  {
    id: 'icici',
    name: 'Credit Card',
    institution: 'ICICI Bank',
    type: 'credit-card',
    balance: 48200,
    monthlyChangePercent: 5.6,
    currency: 'INR',
    accountsCount: 2,
    maskedNumber: '•••• 9034',
    lastSynced: '8 min ago',
  },
  {
    id: 'paytm',
    name: 'Wallet',
    institution: 'Paytm Wallet',
    type: 'wallet',
    balance: 12400,
    monthlyChangePercent: -3.1,
    currency: 'INR',
    accountsCount: 1,
    maskedNumber: '•••• 1177',
    lastSynced: '1 hr ago',
  },
  {
    id: 'axis',
    name: 'Savings Account',
    institution: 'Axis Bank',
    type: 'bank',
    balance: 96800,
    monthlyChangePercent: 2.4,
    currency: 'INR',
    accountsCount: 1,
    maskedNumber: '•••• 8821',
    lastSynced: '15 min ago',
  },
  {
    id: 'axis-debit',
    name: 'Debit Card',
    institution: 'Axis Bank',
    type: 'debit-card',
    // Mirrors the Axis savings account — shown for convenience, never
    // counted in totals (that would double-count the same money).
    balance: 96800,
    monthlyChangePercent: 2.4,
    currency: 'INR',
    accountsCount: 1,
    maskedNumber: '•••• 6650',
    lastSynced: '15 min ago',
    linkedAccountId: 'axis',
  },
  {
    id: 'cash',
    name: 'In Hand',
    institution: 'Cash',
    type: 'cash',
    balance: 6150,
    monthlyChangePercent: 3.0,
    currency: 'INR',
    lastSynced: 'Manual',
  },
]

/* ── Category metadata — presentation + budgets only; totals are derived ── */

export const categoryMeta: CategoryMeta[] = [
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#ff2d78', budget: 50000, group: 'wants' },
  { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#ffaa2b', budget: 6000, group: 'needs' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'file-text', color: '#14d9ff', budget: 6000, group: 'needs' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#16e6a1', budget: 5000, group: 'needs' },
  { id: 'entertainment', name: 'Entertainment', icon: 'play', color: '#a855f7', budget: 2500, group: 'wants' },
  { id: 'healthcare', name: 'Healthcare', icon: 'heart-pulse', color: '#fb7185', budget: 3000, group: 'lifestyle' },
  { id: 'education', name: 'Education', icon: 'book-open', color: '#2dd4bf', budget: 5000, group: 'lifestyle' },
  { id: 'travel', name: 'Travel', icon: 'plane', color: '#60a5fa', budget: 18000, group: 'wants' },
  { id: 'others', name: 'Others', icon: 'more-horizontal', color: '#94a3b8', group: 'others' },
]

/* ── Transactions — the spine of the product ───────────────────────────── */

export const transactions: Transaction[] = [
  /* July 2026 — current month */
  { id: 'j1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 Jul', isoDate: '2026-07-01', status: 'completed', isRecurring: true },
  { id: 'j2', merchant: 'Freelance Payment', subtitle: 'Upwork', category: 'Freelance', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 26500, currency: 'INR', time: '04:18 PM', date: '12 Jul', isoDate: '2026-07-12', status: 'completed' },
  { id: 'j3', merchant: 'Cashback Received', subtitle: 'Paytm Wallet', category: 'Rewards', icon: 'wallet', account: 'Paytm Wallet', type: 'refund', amount: 210, currency: 'INR', time: '02:21 PM', date: '11 Jul', isoDate: '2026-07-11', status: 'completed' },
  { id: 'j4', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 4299, currency: 'INR', time: '09:11 PM', date: '3 Jul', isoDate: '2026-07-03', status: 'completed', hasReceipt: true },
  { id: 'j5', merchant: 'Flipkart Order', subtitle: 'Flipkart', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 2199, currency: 'INR', time: '07:42 PM', date: '6 Jul', isoDate: '2026-07-06', status: 'completed' },
  { id: 'j6', merchant: 'Myntra Sale', subtitle: 'Myntra', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 3450, currency: 'INR', time: '08:05 PM', date: '9 Jul', isoDate: '2026-07-09', status: 'completed', hasReceipt: true },
  { id: 'j7', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 6780, currency: 'INR', time: '10:26 PM', date: '15 Jul', isoDate: '2026-07-15', status: 'completed', hasReceipt: true },
  { id: 'j8', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 450, currency: 'INR', time: '01:14 PM', date: '2 Jul', isoDate: '2026-07-02', status: 'completed', hasReceipt: true },
  { id: 'j9', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 380, currency: 'INR', time: '08:33 PM', date: '4 Jul', isoDate: '2026-07-04', status: 'completed' },
  { id: 'j10', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 620, currency: 'INR', time: '01:02 PM', date: '8 Jul', isoDate: '2026-07-08', status: 'completed' },
  { id: 'j11', merchant: 'Starbucks', subtitle: 'Starbucks', category: 'Food & Dining', icon: 'utensils', account: 'Cash', type: 'expense', amount: 540, currency: 'INR', time: '11:20 AM', date: '10 Jul', isoDate: '2026-07-10', status: 'completed' },
  { id: 'j12', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 410, currency: 'INR', time: '08:47 PM', date: '13 Jul', isoDate: '2026-07-13', status: 'completed' },
  { id: 'j13', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 780, currency: 'INR', time: '12:58 PM', date: '16 Jul', isoDate: '2026-07-16', status: 'completed' },
  { id: 'j14', merchant: 'Burger King', subtitle: 'Burger King', category: 'Food & Dining', icon: 'utensils', account: 'Cash', type: 'expense', amount: 350, currency: 'INR', time: '07:15 PM', date: '18 Jul', isoDate: '2026-07-18', status: 'completed' },
  { id: 'j15', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 2140, currency: 'INR', time: '10:32 AM', date: '5 Jul', isoDate: '2026-07-05', status: 'completed', hasReceipt: true },
  { id: 'j16', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '6 Jul', isoDate: '2026-07-06', status: 'completed', isRecurring: true },
  { id: 'j17', merchant: 'JioFiber Broadband', subtitle: 'Jio', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 999, currency: 'INR', time: '09:05 AM', date: '8 Jul', isoDate: '2026-07-08', status: 'completed', isRecurring: true },
  { id: 'j18', merchant: 'Water Bill', subtitle: 'BWSSB', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 460, currency: 'INR', time: '11:41 AM', date: '12 Jul', isoDate: '2026-07-12', status: 'completed' },
  { id: 'j19', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '3 Jul', isoDate: '2026-07-03', status: 'completed' },
  { id: 'j20', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 340, currency: 'INR', time: '09:12 AM', date: '7 Jul', isoDate: '2026-07-07', status: 'completed' },
  { id: 'j21', merchant: 'Metro Recharge', subtitle: 'Namma Metro', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 500, currency: 'INR', time: '08:30 AM', date: '9 Jul', isoDate: '2026-07-09', status: 'completed' },
  { id: 'j22', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:52 PM', date: '14 Jul', isoDate: '2026-07-14', status: 'completed' },
  { id: 'j23', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 285, currency: 'INR', time: '10:05 PM', date: '17 Jul', isoDate: '2026-07-17', status: 'completed' },
  { id: 'j24', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '2 Jul', isoDate: '2026-07-02', status: 'completed', isRecurring: true },
  { id: 'j25', merchant: 'Spotify Premium', subtitle: 'Spotify', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 119, currency: 'INR', time: '08:00 AM', date: '5 Jul', isoDate: '2026-07-05', status: 'completed', isRecurring: true },
  { id: 'j26', merchant: 'Prime Video', subtitle: 'Amazon', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 299, currency: 'INR', time: '08:00 AM', date: '9 Jul', isoDate: '2026-07-09', status: 'completed', isRecurring: true },
  { id: 'j27', merchant: 'Movie Tickets', subtitle: 'BookMyShow', category: 'Entertainment', icon: 'play', account: 'HDFC Bank', type: 'expense', amount: 890, currency: 'INR', time: '07:30 PM', date: '11 Jul', isoDate: '2026-07-11', status: 'completed' },
  { id: 'j28', merchant: 'Apollo Pharmacy', subtitle: 'Apollo', category: 'Healthcare', icon: 'heart-pulse', account: 'Cash', type: 'expense', amount: 840, currency: 'INR', time: '11:10 AM', date: '6 Jul', isoDate: '2026-07-06', status: 'completed' },
  { id: 'j29', merchant: 'Doctor Consultation', subtitle: 'Manipal Clinic', category: 'Healthcare', icon: 'heart-pulse', account: 'HDFC Bank', type: 'expense', amount: 1200, currency: 'INR', time: '05:20 PM', date: '15 Jul', isoDate: '2026-07-15', status: 'completed' },
  { id: 'j30', merchant: 'Udemy Course', subtitle: 'Udemy', category: 'Education', icon: 'book-open', account: 'ICICI Bank', type: 'expense', amount: 3499, currency: 'INR', time: '09:45 PM', date: '8 Jul', isoDate: '2026-07-08', status: 'completed' },
  { id: 'j31', merchant: 'Birthday Gift', subtitle: 'Gift', category: 'Others', icon: 'more-horizontal', account: 'Paytm Wallet', type: 'expense', amount: 1500, currency: 'INR', time: '06:20 PM', date: '14 Jul', isoDate: '2026-07-14', status: 'completed' },
  { id: 'j32', merchant: 'Miscellaneous', subtitle: 'Local Store', category: 'Others', icon: 'more-horizontal', account: 'Cash', type: 'expense', amount: 600, currency: 'INR', time: '12:40 PM', date: '19 Jul', isoDate: '2026-07-19', status: 'completed' },
  { id: 'j33', merchant: 'Transfer to ICICI', subtitle: 'HDFC Bank → ICICI Bank', category: 'Transfer', icon: 'landmark', account: 'HDFC Bank', type: 'transfer', amount: 10000, currency: 'INR', time: '11:02 AM', date: '4 Jul', isoDate: '2026-07-04', status: 'completed' },
  { id: 'j34', merchant: 'Wallet Top-up', subtitle: 'HDFC Bank → Paytm Wallet', category: 'Transfer', icon: 'landmark', account: 'HDFC Bank', type: 'transfer', amount: 2000, currency: 'INR', time: '09:15 AM', date: '10 Jul', isoDate: '2026-07-10', status: 'completed' },

  /* June 2026 */
  { id: 'n1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 Jun', isoDate: '2026-06-01', status: 'completed', isRecurring: true },
  { id: 'n2', merchant: 'Freelance Payment', subtitle: 'Upwork', category: 'Freelance', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 22000, currency: 'INR', time: '04:18 PM', date: '14 Jun', isoDate: '2026-06-14', status: 'completed' },
  { id: 'n3', merchant: 'Amazon Refund', subtitle: 'Amazon', category: 'Rewards', icon: 'wallet', account: 'ICICI Bank', type: 'refund', amount: 1299, currency: 'INR', time: '03:40 PM', date: '16 Jun', isoDate: '2026-06-16', status: 'completed' },
  { id: 'n4', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 12800, currency: 'INR', time: '09:11 PM', date: '5 Jun', isoDate: '2026-06-05', status: 'completed', hasReceipt: true, isSplit: true },
  { id: 'n5', merchant: 'Myntra Sale', subtitle: 'Myntra', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 4100, currency: 'INR', time: '08:22 PM', date: '9 Jun', isoDate: '2026-06-09', status: 'completed' },
  { id: 'n6', merchant: 'Flipkart Order', subtitle: 'Flipkart', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 2850, currency: 'INR', time: '07:15 PM', date: '12 Jun', isoDate: '2026-06-12', status: 'completed', hasReceipt: true },
  { id: 'n7', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 7999, currency: 'INR', time: '09:48 PM', date: '18 Jun', isoDate: '2026-06-18', status: 'completed' },
  { id: 'n8', merchant: 'Croma Store', subtitle: 'Croma', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 9450, currency: 'INR', time: '05:35 PM', date: '24 Jun', isoDate: '2026-06-24', status: 'completed', hasReceipt: true },
  { id: 'n9', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 520, currency: 'INR', time: '01:10 PM', date: '2 Jun', isoDate: '2026-06-02', status: 'completed' },
  { id: 'n10', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 465, currency: 'INR', time: '08:40 PM', date: '4 Jun', isoDate: '2026-06-04', status: 'completed' },
  { id: 'n11', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 890, currency: 'INR', time: '01:25 PM', date: '8 Jun', isoDate: '2026-06-08', status: 'completed' },
  { id: 'n12', merchant: 'Starbucks', subtitle: 'Starbucks', category: 'Food & Dining', icon: 'utensils', account: 'Cash', type: 'expense', amount: 610, currency: 'INR', time: '11:15 AM', date: '11 Jun', isoDate: '2026-06-11', status: 'completed' },
  { id: 'n13', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 540, currency: 'INR', time: '08:55 PM', date: '15 Jun', isoDate: '2026-06-15', status: 'completed' },
  { id: 'n14', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 720, currency: 'INR', time: '12:50 PM', date: '19 Jun', isoDate: '2026-06-19', status: 'completed' },
  { id: 'n15', merchant: 'Dominos Pizza', subtitle: 'Dominos', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 650, currency: 'INR', time: '08:20 PM', date: '22 Jun', isoDate: '2026-06-22', status: 'completed', isSplit: true },
  { id: 'n16', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 385, currency: 'INR', time: '09:05 PM', date: '26 Jun', isoDate: '2026-06-26', status: 'completed' },
  { id: 'n17', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 940, currency: 'INR', time: '01:35 PM', date: '29 Jun', isoDate: '2026-06-29', status: 'completed' },
  { id: 'n18', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 2360, currency: 'INR', time: '10:32 AM', date: '4 Jun', isoDate: '2026-06-04', status: 'completed', hasReceipt: true },
  { id: 'n19', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '6 Jun', isoDate: '2026-06-06', status: 'completed', isRecurring: true },
  { id: 'n20', merchant: 'JioFiber Broadband', subtitle: 'Jio', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 999, currency: 'INR', time: '09:05 AM', date: '8 Jun', isoDate: '2026-06-08', status: 'completed', isRecurring: true },
  { id: 'n21', merchant: 'Gas Bill', subtitle: 'Indane', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 1105, currency: 'INR', time: '11:20 AM', date: '13 Jun', isoDate: '2026-06-13', status: 'completed' },
  { id: 'n22', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '3 Jun', isoDate: '2026-06-03', status: 'completed' },
  { id: 'n23', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 310, currency: 'INR', time: '09:20 AM', date: '7 Jun', isoDate: '2026-06-07', status: 'completed' },
  { id: 'n24', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:50 PM', date: '17 Jun', isoDate: '2026-06-17', status: 'completed' },
  { id: 'n25', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 425, currency: 'INR', time: '10:15 PM', date: '21 Jun', isoDate: '2026-06-21', status: 'completed' },
  { id: 'n26', merchant: 'Metro Recharge', subtitle: 'Namma Metro', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 500, currency: 'INR', time: '08:30 AM', date: '25 Jun', isoDate: '2026-06-25', status: 'completed' },
  { id: 'n27', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '2 Jun', isoDate: '2026-06-02', status: 'completed', isRecurring: true },
  { id: 'n28', merchant: 'Spotify Premium', subtitle: 'Spotify', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 119, currency: 'INR', time: '08:00 AM', date: '5 Jun', isoDate: '2026-06-05', status: 'completed', isRecurring: true },
  { id: 'n29', merchant: 'Movie Tickets', subtitle: 'BookMyShow', category: 'Entertainment', icon: 'play', account: 'HDFC Bank', type: 'expense', amount: 1120, currency: 'INR', time: '07:30 PM', date: '14 Jun', isoDate: '2026-06-14', status: 'completed' },
  { id: 'n30', merchant: 'Steam Game', subtitle: 'Steam', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 799, currency: 'INR', time: '10:40 PM', date: '20 Jun', isoDate: '2026-06-20', status: 'completed' },
  { id: 'n31', merchant: 'Apollo Pharmacy', subtitle: 'Apollo', category: 'Healthcare', icon: 'heart-pulse', account: 'Cash', type: 'expense', amount: 560, currency: 'INR', time: '11:10 AM', date: '10 Jun', isoDate: '2026-06-10', status: 'completed' },
  { id: 'n32', merchant: 'Goa Flights', subtitle: 'IndiGo', category: 'Travel', icon: 'plane', account: 'HDFC Bank', type: 'expense', amount: 8400, currency: 'INR', time: '06:15 AM', date: '21 Jun', isoDate: '2026-06-21', status: 'completed', hasReceipt: true },
  { id: 'n33', merchant: 'Goa Hotel', subtitle: 'Taj Resort', category: 'Travel', icon: 'plane', account: 'HDFC Bank', type: 'expense', amount: 6200, currency: 'INR', time: '02:00 PM', date: '22 Jun', isoDate: '2026-06-22', status: 'completed', hasReceipt: true, isSplit: true },
  { id: 'n34', merchant: 'Goa Cab', subtitle: 'GoaMiles', category: 'Travel', icon: 'plane', account: 'Cash', type: 'expense', amount: 1450, currency: 'INR', time: '11:30 AM', date: '23 Jun', isoDate: '2026-06-23', status: 'completed' },
  { id: 'n35', merchant: 'Salon', subtitle: 'Urban Company', category: 'Others', icon: 'more-horizontal', account: 'Paytm Wallet', type: 'expense', amount: 800, currency: 'INR', time: '04:30 PM', date: '16 Jun', isoDate: '2026-06-16', status: 'completed' },
  { id: 'n36', merchant: 'Gift', subtitle: 'Gift', category: 'Others', icon: 'more-horizontal', account: 'Paytm Wallet', type: 'expense', amount: 2000, currency: 'INR', time: '07:45 PM', date: '27 Jun', isoDate: '2026-06-27', status: 'completed' },
  { id: 'n37', merchant: 'Transfer from ICICI', subtitle: 'ICICI Bank → HDFC Bank', category: 'Transfer', icon: 'landmark', account: 'ICICI Bank', type: 'transfer', amount: 5000, currency: 'INR', time: '10:10 AM', date: '9 Jun', isoDate: '2026-06-09', status: 'completed' },

  /* May 2026 */
  { id: 'm1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 May', isoDate: '2026-05-01', status: 'completed', isRecurring: true },
  { id: 'm2', merchant: 'Freelance Payment', subtitle: 'Upwork', category: 'Freelance', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 18500, currency: 'INR', time: '04:18 PM', date: '21 May', isoDate: '2026-05-21', status: 'completed' },
  { id: 'm3', merchant: 'Cashback Received', subtitle: 'Paytm Wallet', category: 'Rewards', icon: 'wallet', account: 'Paytm Wallet', type: 'refund', amount: 180, currency: 'INR', time: '02:21 PM', date: '9 May', isoDate: '2026-05-09', status: 'completed' },
  { id: 'm4', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 8999, currency: 'INR', time: '09:11 PM', date: '8 May', isoDate: '2026-05-08', status: 'completed', hasReceipt: true },
  { id: 'm5', merchant: 'Flipkart Order', subtitle: 'Flipkart', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 3200, currency: 'INR', time: '07:30 PM', date: '15 May', isoDate: '2026-05-15', status: 'completed' },
  { id: 'm6', merchant: 'Myntra Sale', subtitle: 'Myntra', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 2750, currency: 'INR', time: '08:12 PM', date: '22 May', isoDate: '2026-05-22', status: 'completed' },
  { id: 'm7', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 480, currency: 'INR', time: '01:14 PM', date: '3 May', isoDate: '2026-05-03', status: 'completed' },
  { id: 'm8', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 520, currency: 'INR', time: '08:33 PM', date: '7 May', isoDate: '2026-05-07', status: 'completed' },
  { id: 'm9', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 610, currency: 'INR', time: '01:02 PM', date: '12 May', isoDate: '2026-05-12', status: 'completed' },
  { id: 'm10', merchant: 'Starbucks', subtitle: 'Starbucks', category: 'Food & Dining', icon: 'utensils', account: 'Cash', type: 'expense', amount: 445, currency: 'INR', time: '11:20 AM', date: '18 May', isoDate: '2026-05-18', status: 'completed' },
  { id: 'm11', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 395, currency: 'INR', time: '08:47 PM', date: '24 May', isoDate: '2026-05-24', status: 'completed' },
  { id: 'm12', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 555, currency: 'INR', time: '12:58 PM', date: '28 May', isoDate: '2026-05-28', status: 'completed' },
  { id: 'm13', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 2140, currency: 'INR', time: '10:32 AM', date: '25 May', isoDate: '2026-05-25', status: 'completed', hasReceipt: true },
  { id: 'm14', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '5 May', isoDate: '2026-05-05', status: 'completed', isRecurring: true },
  { id: 'm15', merchant: 'JioFiber Broadband', subtitle: 'Jio', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 999, currency: 'INR', time: '09:05 AM', date: '8 May', isoDate: '2026-05-08', status: 'completed', isRecurring: true },
  { id: 'm16', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '6 May', isoDate: '2026-05-06', status: 'completed' },
  { id: 'm17', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 290, currency: 'INR', time: '09:12 AM', date: '13 May', isoDate: '2026-05-13', status: 'completed' },
  { id: 'm18', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:52 PM', date: '20 May', isoDate: '2026-05-20', status: 'completed' },
  { id: 'm19', merchant: 'Metro Recharge', subtitle: 'Namma Metro', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 500, currency: 'INR', time: '08:30 AM', date: '27 May', isoDate: '2026-05-27', status: 'completed' },
  { id: 'm20', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '28 May', isoDate: '2026-05-28', status: 'completed', isRecurring: true },
  { id: 'm21', merchant: 'Spotify Premium', subtitle: 'Spotify', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 119, currency: 'INR', time: '08:00 AM', date: '5 May', isoDate: '2026-05-05', status: 'completed', isRecurring: true },
  { id: 'm22', merchant: 'Movie Tickets', subtitle: 'BookMyShow', category: 'Entertainment', icon: 'play', account: 'HDFC Bank', type: 'expense', amount: 760, currency: 'INR', time: '07:30 PM', date: '17 May', isoDate: '2026-05-17', status: 'completed' },
  { id: 'm23', merchant: 'Gym Membership', subtitle: 'Cult.fit', category: 'Healthcare', icon: 'heart-pulse', account: 'HDFC Bank', type: 'expense', amount: 1500, currency: 'INR', time: '07:00 AM', date: '2 May', isoDate: '2026-05-02', status: 'completed', isRecurring: true },
  { id: 'm24', merchant: 'Apollo Pharmacy', subtitle: 'Apollo', category: 'Healthcare', icon: 'heart-pulse', account: 'Cash', type: 'expense', amount: 430, currency: 'INR', time: '11:10 AM', date: '19 May', isoDate: '2026-05-19', status: 'completed' },
  { id: 'm25', merchant: 'Udemy Course', subtitle: 'Udemy', category: 'Education', icon: 'book-open', account: 'ICICI Bank', type: 'expense', amount: 4999, currency: 'INR', time: '09:45 PM', date: '10 May', isoDate: '2026-05-10', status: 'completed' },
  { id: 'm26', merchant: 'Miscellaneous', subtitle: 'Local Store', category: 'Others', icon: 'more-horizontal', account: 'Cash', type: 'expense', amount: 900, currency: 'INR', time: '12:40 PM', date: '30 May', isoDate: '2026-05-30', status: 'completed' },
  { id: 'm27', merchant: 'Wallet Top-up', subtitle: 'HDFC Bank → Paytm Wallet', category: 'Transfer', icon: 'landmark', account: 'HDFC Bank', type: 'transfer', amount: 1500, currency: 'INR', time: '09:15 AM', date: '14 May', isoDate: '2026-05-14', status: 'completed' },

  /* Earlier months — keeps the 1Y cash-flow view honest */
  { id: 'o1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 Apr', isoDate: '2026-04-01', status: 'completed', isRecurring: true },
  { id: 'o2', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 1980, currency: 'INR', time: '10:32 AM', date: '5 Apr', isoDate: '2026-04-05', status: 'completed' },
  { id: 'o3', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '6 Apr', isoDate: '2026-04-06', status: 'completed', isRecurring: true },
  { id: 'o4', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 520, currency: 'INR', time: '01:14 PM', date: '9 Apr', isoDate: '2026-04-09', status: 'completed' },
  { id: 'o5', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '11 Apr', isoDate: '2026-04-11', status: 'completed' },
  { id: 'o6', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 445, currency: 'INR', time: '08:33 PM', date: '18 Apr', isoDate: '2026-04-18', status: 'completed' },
  { id: 'o7', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '2 Apr', isoDate: '2026-04-02', status: 'completed', isRecurring: true },
  { id: 'o8', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 5400, currency: 'INR', time: '09:11 PM', date: '15 Apr', isoDate: '2026-04-15', status: 'completed' },
  { id: 'p1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 Mar', isoDate: '2026-03-01', status: 'completed', isRecurring: true },
  { id: 'p2', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 2050, currency: 'INR', time: '10:32 AM', date: '4 Mar', isoDate: '2026-03-04', status: 'completed' },
  { id: 'p3', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '6 Mar', isoDate: '2026-03-06', status: 'completed', isRecurring: true },
  { id: 'p4', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '8 Mar', isoDate: '2026-03-08', status: 'completed' },
  { id: 'p5', merchant: 'Lunch at Zomato', subtitle: 'Zomato', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 610, currency: 'INR', time: '01:14 PM', date: '13 Mar', isoDate: '2026-03-13', status: 'completed' },
  { id: 'p6', merchant: 'Flipkart Order', subtitle: 'Flipkart', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 3200, currency: 'INR', time: '07:30 PM', date: '17 Mar', isoDate: '2026-03-17', status: 'completed' },
  { id: 'p7', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '2 Mar', isoDate: '2026-03-02', status: 'completed', isRecurring: true },
  { id: 'p8', merchant: 'Uber Ride', subtitle: 'Uber', category: 'Transport', icon: 'car', account: 'Paytm Wallet', type: 'expense', amount: 320, currency: 'INR', time: '09:12 AM', date: '21 Mar', isoDate: '2026-03-21', status: 'completed' },
  { id: 'q1', merchant: 'Salary Credited', subtitle: 'Acme Corp', category: 'Salary', icon: 'briefcase', account: 'HDFC Bank', type: 'income', amount: 85000, currency: 'INR', time: '09:21 AM', date: '1 Feb', isoDate: '2026-02-01', status: 'completed', isRecurring: true },
  { id: 'q2', merchant: 'Electricity Bill', subtitle: 'BESCOM', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 1870, currency: 'INR', time: '10:32 AM', date: '5 Feb', isoDate: '2026-02-05', status: 'completed' },
  { id: 'q3', merchant: 'Airtel Mobile', subtitle: 'Airtel', category: 'Bills & Utilities', icon: 'file-text', account: 'HDFC Bank', type: 'expense', amount: 549, currency: 'INR', time: '09:00 AM', date: '6 Feb', isoDate: '2026-02-06', status: 'completed', isRecurring: true },
  { id: 'q4', merchant: 'Petrol', subtitle: 'IndianOil', category: 'Transport', icon: 'fuel', account: 'Axis Bank', type: 'expense', amount: 2000, currency: 'INR', time: '06:45 PM', date: '10 Feb', isoDate: '2026-02-10', status: 'completed' },
  { id: 'q5', merchant: 'Dinner at Swiggy', subtitle: 'Swiggy', category: 'Food & Dining', icon: 'utensils', account: 'Paytm Wallet', type: 'expense', amount: 520, currency: 'INR', time: '08:33 PM', date: '14 Feb', isoDate: '2026-02-14', status: 'completed' },
  { id: 'q6', merchant: 'Netflix Subscription', subtitle: 'Netflix', category: 'Entertainment', icon: 'play', account: 'ICICI Bank', type: 'expense', amount: 649, currency: 'INR', time: '08:00 AM', date: '2 Feb', isoDate: '2026-02-02', status: 'completed', isRecurring: true },
  { id: 'q7', merchant: 'Amazon Order', subtitle: 'Amazon', category: 'Shopping', icon: 'shopping-bag', account: 'ICICI Bank', type: 'expense', amount: 4300, currency: 'INR', time: '09:11 PM', date: '19 Feb', isoDate: '2026-02-19', status: 'completed' },
]

/* ── SplitPay entities (manual-entry split state) ──────────────────────── */

export const splitGroups: SplitGroup[] = [
  {
    id: 'goa',
    name: 'Goa Trip',
    emojiIcon: 'palmtree',
    coverColor: 'var(--negative)',
    membersSettled: 3,
    membersTotal: 5,
    memberAvatars: ['R', 'A', 'K', 'P'],
    extraMembers: 2,
    status: 'you-owe',
    amount: 1600,
    totalAmount: 10800,
    currency: 'INR',
  },
  {
    id: 'dinner',
    name: 'College Friends Dinner',
    emojiIcon: 'pizza',
    coverColor: 'var(--warning)',
    membersSettled: 2,
    membersTotal: 4,
    memberAvatars: ['R', 'S', 'M'],
    extraMembers: 1,
    status: 'you-are-owed',
    amount: 2300,
    totalAmount: 4600,
    currency: 'INR',
  },
  {
    id: 'rent',
    name: 'Rent & Utilities',
    emojiIcon: 'home',
    coverColor: 'var(--primary)',
    membersSettled: 3,
    membersTotal: 3,
    memberAvatars: ['R', 'A', 'K'],
    extraMembers: 3,
    status: 'settled',
    amount: 0,
    totalAmount: 6000,
    currency: 'INR',
  },
  {
    id: 'movie',
    name: 'Weekend Outing',
    emojiIcon: 'popcorn',
    coverColor: 'var(--negative)',
    membersSettled: 1,
    membersTotal: 3,
    memberAvatars: ['P', 'K', 'S'],
    extraMembers: 1,
    status: 'you-owe',
    amount: 1000,
    totalAmount: 3500,
    currency: 'INR',
  },
]

export const splitMembers: SplitMember[] = [
  { id: 'm1', name: 'Rohit Sharma', avatar: 'RS', netBalance: 1600, direction: 'you-owe', lastActive: '1h ago' },
  { id: 'm2', name: 'Ananya Gupta', avatar: 'AG', netBalance: 1250, direction: 'owes-you', lastActive: '3h ago' },
  { id: 'm3', name: 'Karan Mehta', avatar: 'KM', netBalance: 1000, direction: 'you-owe', lastActive: 'Yesterday' },
  { id: 'm4', name: 'Priya Singh', avatar: 'PS', netBalance: 1050, direction: 'owes-you', lastActive: '2d ago' },
]

/* ── Account details — per-account metadata grids (keyed by account id) ── */

const hdfcMonthlyNet = accountMonthlyNet(transactions, 'HDFC Bank')

export const accountDetailsById: Record<string, AccountDetails> = {
  hdfc: {
    accountId: 'hdfc',
    currency: 'INR',
    primaryAmountLabel: 'Available Balance',
    primaryAmount: 284500,
    secondaryAmountLabel: 'Ledger Balance',
    secondaryAmount: 286210,
    progressPercent: 62,
    footnoteLabel: 'Monthly Change',
    footnoteValue: `${hdfcMonthlyNet >= 0 ? '+' : '−'}₹${Math.abs(hdfcMonthlyNet).toLocaleString('en-IN')} this month`,
    fields: [
      { id: 'type', label: 'Account Type', value: 'Savings Account', icon: 'landmark' },
      { id: 'number', label: 'Account Number', value: '•••• 4821', icon: 'hash', copyable: true },
      { id: 'ifsc', label: 'IFSC Code', value: 'HDFC0001234', icon: 'qr-code', copyable: true },
      { id: 'branch', label: 'Branch', value: 'Connaught Place, New Delhi', icon: 'map-pin' },
      { id: 'opened', label: 'Opened On', value: '12 Jan 2023', icon: 'calendar' },
      { id: 'interest', label: 'Interest Rate', value: '2.75% p.a.', icon: 'percent' },
      { id: 'synced', label: 'Last Synced', value: 'Today, 08:45 AM', icon: 'clock' },
      { id: 'status', label: 'Status', value: 'Active', icon: 'check-circle', tone: 'positive' },
    ],
  },
  icici: {
    accountId: 'icici',
    currency: 'INR',
    primaryAmountLabel: 'Outstanding',
    primaryAmount: 48200,
    secondaryAmountLabel: 'Available Limit',
    secondaryAmount: 151800,
    progressPercent: 24,
    footnoteLabel: 'Credit Utilization',
    footnoteValue: '24% of ₹2,00,000',
    fields: [
      { id: 'type', label: 'Card Type', value: 'Credit Card', icon: 'credit-card' },
      { id: 'number', label: 'Card Number', value: '•••• 9034', icon: 'hash', copyable: true },
      { id: 'statement', label: 'Statement Date', value: '01 Aug 2026', icon: 'calendar' },
      { id: 'due', label: 'Due Date', value: '18 Aug 2026', icon: 'calendar-clock' },
      { id: 'min-due', label: 'Minimum Due', value: '₹2,410', icon: 'banknote' },
      { id: 'rewards', label: 'Reward Points', value: '12,480 pts', icon: 'sparkles', tone: 'positive' },
      { id: 'issuer', label: 'Issuer', value: 'ICICI Bank', icon: 'landmark' },
      { id: 'status', label: 'Status', value: 'Active', icon: 'check-circle', tone: 'positive' },
    ],
  },
  paytm: {
    accountId: 'paytm',
    currency: 'INR',
    primaryAmountLabel: 'Current Balance',
    primaryAmount: 12400,
    secondaryAmountLabel: 'Monthly Usage',
    secondaryAmount: 8340,
    progressPercent: 42,
    footnoteLabel: 'Daily Limit',
    footnoteValue: '₹10,000 / day',
    fields: [
      { id: 'type', label: 'Wallet Type', value: 'Prepaid Wallet', icon: 'wallet' },
      { id: 'linked', label: 'Linked Number', value: '•••• 98210', icon: 'smartphone', copyable: true },
      { id: 'upi', label: 'UPI ID', value: 'arjun@paytm', icon: 'at-sign', copyable: true },
      { id: 'bank', label: 'Linked Bank', value: 'HDFC Bank', icon: 'landmark' },
      { id: 'kyc', label: 'KYC', value: 'Full KYC', icon: 'shield-check', tone: 'positive' },
      { id: 'synced', label: 'Last Synced', value: 'Today, 07:58 AM', icon: 'clock' },
      { id: 'status', label: 'Status', value: 'Active', icon: 'check-circle', tone: 'positive' },
    ],
  },
  axis: {
    accountId: 'axis',
    currency: 'INR',
    primaryAmountLabel: 'Available Balance',
    primaryAmount: 96800,
    secondaryAmountLabel: 'Ledger Balance',
    secondaryAmount: 97240,
    progressPercent: 51,
    footnoteLabel: 'Linked Card',
    footnoteValue: 'Debit •••• 6650 mirrors this account',
    fields: [
      { id: 'type', label: 'Account Type', value: 'Savings Account', icon: 'landmark' },
      { id: 'number', label: 'Account Number', value: '•••• 8821', icon: 'hash', copyable: true },
      { id: 'ifsc', label: 'IFSC Code', value: 'UTIB0000456', icon: 'qr-code', copyable: true },
      { id: 'bank', label: 'Bank', value: 'Axis Bank', icon: 'landmark' },
      { id: 'card', label: 'Linked Card', value: 'Debit •••• 6650', icon: 'credit-card' },
      { id: 'synced', label: 'Last Synced', value: 'Today, 08:30 AM', icon: 'clock' },
      { id: 'status', label: 'Status', value: 'Active', icon: 'check-circle', tone: 'positive' },
    ],
  },
  'axis-debit': {
    accountId: 'axis-debit',
    currency: 'INR',
    primaryAmountLabel: 'Available (Axis Savings)',
    primaryAmount: 96800,
    secondaryAmountLabel: 'ATM Limit',
    secondaryAmount: 50000,
    progressPercent: 51,
    footnoteLabel: 'Linked Account',
    footnoteValue: 'Mirrors Axis Savings •••• 8821',
    fields: [
      { id: 'type', label: 'Card Type', value: 'Debit Card', icon: 'credit-card' },
      { id: 'number', label: 'Card Number', value: '•••• 6650', icon: 'hash', copyable: true },
      { id: 'linked', label: 'Linked Account', value: 'Axis Savings •••• 8821', icon: 'landmark' },
      { id: 'bank', label: 'Bank', value: 'Axis Bank', icon: 'landmark' },
      { id: 'online', label: 'Online Limit', value: '₹1,00,000 / day', icon: 'globe', tone: 'positive' },
      { id: 'contactless', label: 'Contactless', value: 'Enabled', icon: 'wifi', tone: 'positive' },
      { id: 'synced', label: 'Last Synced', value: 'Today, 08:30 AM', icon: 'clock' },
      { id: 'status', label: 'Status', value: 'Active', icon: 'check-circle', tone: 'positive' },
    ],
  },
  cash: {
    accountId: 'cash',
    currency: 'INR',
    primaryAmountLabel: 'Total Cash',
    primaryAmount: 6150,
    secondaryAmountLabel: 'Emergency Cash',
    secondaryAmount: 1000,
    progressPercent: 47,
    footnoteLabel: 'Last Updated',
    footnoteValue: 'Today, 09:20 AM',
    fields: [
      { id: 'home', label: 'Home Cash', value: '₹3,200', icon: 'home' },
      { id: 'office', label: 'Office Cash', value: '₹1,450', icon: 'briefcase' },
      { id: 'travel', label: 'Travel Cash', value: '₹1,500', icon: 'plane' },
      { id: 'location', label: 'Location', value: 'Home Safe', icon: 'map-pin' },
      { id: 'denomination', label: 'Denomination', value: 'Mixed', icon: 'banknote' },
      { id: 'edited', label: 'Last Edited By', value: 'You', icon: 'user' },
      { id: 'security', label: 'Security', value: 'Encrypted', icon: 'shield-check', tone: 'positive' },
    ],
  },
}

/* ── Independent domains (portfolio watchlist + upcoming bills) ────────── */

export const portfolioSummary: PortfolioSummary = {
  totalValue: 245670.8,
  todaysChange: 2850.45,
  todaysChangePercent: 1.17,
  holdings: 12,
  totalGain: 18670.3,
  totalGainPercent: 8.21,
  sparkline: [30, 42, 38, 55, 48, 62, 58, 74, 66, 82, 78, 92],
  currency: 'INR',
}

export const upcomingBills: Bill[] = [
  {
    id: 'airtel',
    name: 'Airtel Mobile',
    provider: 'AutoPay',
    icon: 'smartphone',
    color: 'var(--negative)',
    amount: 549,
    dueLabel: '06 Aug 2026',
    autopay: true,
    currency: 'INR',
  },
  {
    id: 'netflix',
    name: 'Netflix Subscription',
    provider: 'AutoPay',
    icon: 'play',
    color: 'var(--negative)',
    amount: 649,
    dueLabel: '02 Aug 2026',
    autopay: true,
    currency: 'INR',
  },
  {
    id: 'electricity',
    name: 'Electricity Bill',
    provider: 'BESCOM',
    icon: 'zap',
    color: 'var(--warning)',
    amount: 2140,
    dueLabel: '05 Aug 2026',
    autopay: false,
    currency: 'INR',
  },
  {
    id: 'sip',
    name: 'Mutual Fund SIP',
    provider: 'AutoPay',
    icon: 'trending-up',
    color: 'var(--info)',
    amount: 5000,
    dueLabel: '05 Aug 2026',
    autopay: true,
    currency: 'INR',
  },
]

/* ════════════════════════════════════════════════════════════════════════
   DERIVED PAYLOADS — computed through selectors, never written by hand.
   Every screen consumes these; one transaction change updates them all.
   ════════════════════════════════════════════════════════════════════════ */

const INR = 'INR' as const

/** Overview hero + Accounts headline. */
export const balanceSummary = buildBalanceSummary(accounts, transactions, INR)

/** Overview Money In / Money Out / Net Balance cards (real sparklines). */
export const moneySummary = buildMoneySummary(transactions, INR)

/** Cash-flow chart — one real series per period. */
export const cashFlowByPeriod = buildCashFlowByPeriod(transactions)

/** Current-month daily series (Transactions mini bars). */
export const cashFlow = cashFlowByPeriod['1M']

/** Category totals — always sum to the real expense total. */
export const categories = buildCategorySummaries(transactions, categoryMeta)

/** Categories page headline — same totals as the list above. */
export const categoryPageSummary = buildCategoryPageSummary(transactions, INR)

/** Months with activity (newest first) + month-aware derivations. */
export const availableMonths = listMonths(transactions)
export const getCategoriesForMonth = (monthKey: string) =>
  buildCategorySummaries(transactions, categoryMeta, monthKey)
export const getCategoriesForPeriod = (period: '1M' | '3M' | '6M' | '1Y' | 'All') =>
  buildCategorySummariesForPeriod(transactions, categoryMeta, period)
export const getCategoryPageSummaryForMonth = (monthKey: string) =>
  buildCategoryPageSummary(transactions, INR, monthKey)

/** SplitPay hero + preview — derived from member settlements + groups. */
export const splitPaySummary = buildSplitSummary(splitMembers, splitGroups, INR)

/** Overview insights — generated from real activity, ranked by relevance. */
export const insights = buildInsights(transactions, categoryMeta)

/** Accounts smart insights — derived from per-account activity. */
export const accountInsights = buildAccountInsights(accounts, transactions)

/** Categories-page insight — the engine's biggest category movement. */
export const categoryInsight =
  insights.find((i) => i.id === 'biggest-saving') ??
  insights.find((i) => i.id === 'top-category') ??
  insights[0]

/** Transactions timeline — grouped + summed from the same store. */
export const monthGroups = buildMonthGroups(transactions, INR)
