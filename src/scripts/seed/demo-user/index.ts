/**
 * scripts/seed/demo-user/index.ts
 *
 * The single canonical demo user for SplitFin — no personas. One realistic
 * 15-month financial history for a 29-year-old software engineer in
 * Bangalore: salary + occasional freelance income, a rented apartment, and
 * UPI / Credit Card / Savings / Salary accounts used the way a real person
 * actually uses them.
 *
 * Every number below was tuned against the transaction-count budget in the
 * product spec — "20-30 transactions/month, 300-450 total, not thousands."
 * Earlier drafts of this blueprint used weekly-cadence habits and weekly
 * transfers that compounded to ~120 transactions/month (1,800+ total) over
 * 15 months; every frequency here was deliberately brought back down to a
 * believable density instead. See core/analytics.generator.ts, which
 * validates the generated total falls inside `targetTransactionRange`.
 */

import type { DemoUserBlueprint } from "./demo-user.types";

export const demoUser: DemoUserBlueprint = {
  displayName: "Arjun Rao",
  email: "demo@splitfin.app",
  joinedMonthsAgo: 15,
  historyMonths: 15,
  targetTransactionRange: [300, 460],

  // ─── Accounts ───────────────────────────────────────────────────────────

  accounts: [
    {
      slug: "savings",
      institutionId: "inst_hdfc",
      name: "HDFC Savings",
      type: "bank",
      openingBalanceMilli: 180000000, // ₹1.8L
      maskedNumber: "XXXX XXXX 1234",
      isPrimary: true,
    },
    {
      slug: "salary",
      institutionId: "inst_icici",
      name: "ICICI Salary Account",
      type: "bank",
      openingBalanceMilli: 20000000, // ₹20K
      maskedNumber: "XXXX XXXX 5678",
      isPrimary: false,
    },
    {
      slug: "credit_card",
      institutionId: "inst_hdfc",
      name: "HDFC Credit Card",
      type: "credit-card",
      openingBalanceMilli: 0,
      maskedNumber: "XXXX XXXX 9012",
      linkedToSlug: "savings",
      isPrimary: false,
    },
    {
      slug: "upi",
      institutionId: "inst_phonepe",
      name: "PhonePe UPI",
      type: "wallet",
      openingBalanceMilli: 8000000, // ₹8K
      maskedNumber: "9876543210@ybl",
      linkedToSlug: "savings",
      isPrimary: false,
    },
    {
      slug: "cash",
      institutionId: "inst_cash",
      name: "Cash Wallet",
      type: "cash",
      openingBalanceMilli: 1500000, // ₹1.5K minimal cash on hand
      maskedNumber: "Cash in hand",
      isPrimary: false,
    },
  ],

  // ─── Income (finance/salary.generator.ts) ────────────────────────────────

  incomeEvents: [
    {
      merchantId: "mer_employer_generic",
      accountSlug: "salary",
      label: "Salary",
      cadence: "monthly",
      dayOfMonth: 1,
      amountRangeMilli: [95000000, 105000000], // ₹95K - ₹1.05L
    },
    {
      // "Occasional freelance income" — fires roughly every other month
      // (6 calendar months a year), not every single month.
      merchantId: "mer_fiverr",
      accountSlug: "savings",
      label: "Freelance Income",
      cadence: "monthly",
      dayOfMonth: 18,
      amountRangeMilli: [12000000, 35000000], // ₹12K - ₹35K
      monthsActive: [0, 2, 4, 6, 8, 10], // Jan, Mar, May, Jul, Sep, Nov
    },
  ],

  salaryIncrements: [
    { incomeLabel: "Salary", afterMonthIndex: 6, incrementPercent: 12 },
  ],

  // ─── Interest (finance/interest.generator.ts) ────────────────────────────

  interest: [
    {
      accountSlug: "savings",
      merchantId: "mer_bank_interest",
      dayOfMonth: 30,
      amountRangeMilli: [15000, 45000], // ₹15 - ₹45 monthly savings interest
    },
  ],

  // ─── Recurring bills (finance/expense.generator.ts) ─────────────────────

  recurringExpenses: [
    {
      merchantId: "mer_landlord",
      accountSlug: "savings",
      label: "Rent",
      cadence: "monthly",
      dayOfMonth: 5,
      amountRangeMilli: [22000000, 24000000], // ₹22K - ₹24K
    },
    {
      merchantId: "mer_airtel",
      accountSlug: "credit_card",
      label: "Mobile Bill",
      cadence: "monthly",
      dayOfMonth: 10,
      amountRangeMilli: [499000, 499000], // ₹499
    },
    {
      merchantId: "mer_jiofiber",
      accountSlug: "credit_card",
      label: "Internet Bill",
      cadence: "monthly",
      dayOfMonth: 14,
      amountRangeMilli: [999000, 999000], // ₹999
    },
    {
      merchantId: "mer_indianoil",
      accountSlug: "upi",
      label: "Fuel",
      cadence: "monthly",
      dayOfMonth: 12,
      amountRangeMilli: [400000, 700000], // ₹400 - ₹700 (two-wheeler top-up)
    },
  ],

  bills: [
    {
      id: "bill_electricity",
      merchantId: "mer_bescom",
      label: "Electricity",
      amountRangeMilli: [250000, 700000], // ₹250 - ₹700
      dueDayOfMonth: 20,
      autopay: true,
      linkedAccountSlug: "savings",
    },
    {
      id: "bill_gas",
      merchantId: "mer_indane_gas",
      label: "Gas Cylinder",
      amountRangeMilli: [900000, 900000], // ₹900
      dueDayOfMonth: 16,
      autopay: false,
      linkedAccountSlug: "upi",
    },
  ],

  // ─── Subscriptions (finance/subscription.generator.ts) ───────────────────

  subscriptions: [
    {
      id: "sub_netflix",
      merchantId: "mer_netflix",
      label: "Netflix Premium",
      amountMilli: 649000, // ₹649
      cadence: "monthly",
      billingDayOfMonth: 8,
      linkedAccountSlug: "credit_card",
    },
    {
      id: "sub_spotify",
      merchantId: "mer_spotify",
      label: "Spotify Premium",
      amountMilli: 119000, // ₹119
      cadence: "monthly",
      billingDayOfMonth: 6,
      linkedAccountSlug: "credit_card",
    },
    {
      id: "sub_prime",
      merchantId: "mer_amazon",
      label: "Amazon Prime",
      amountMilli: 1499000, // ₹1,499
      cadence: "yearly",
      billingDayOfMonth: 1,
      linkedAccountSlug: "credit_card",
    },
  ],

  // ─── Everyday discretionary spend (finance/expense.generator.ts) ─────────

  spendingHabits: [
    {
      id: "groceries",
      merchantIds: ["mer_bigbasket", "mer_blinkit", "mer_local_store"],
      accountSlugs: ["upi", "credit_card"],
      amountRangeMilli: [250000, 700000], // ₹250 - ₹700
      timesPerWeek: [0, 1],
      weekendMultiplier: 1.4,
      hourRange: [10, 20],
    },
    {
      id: "food_delivery",
      merchantIds: ["mer_swiggy", "mer_zomato"],
      accountSlugs: ["upi", "credit_card"],
      amountRangeMilli: [250000, 900000], // ₹250 - ₹900
      timesPerWeek: [0, 1],
      weekendMultiplier: 1.6,
      hourRange: [19, 23],
    },
    {
      id: "coffee",
      merchantIds: ["mer_starbucks", "mer_ccd"],
      accountSlugs: ["upi", "cash"],
      amountRangeMilli: [20000, 45000], // ₹20 - ₹45
      timesPerWeek: [0, 1],
      hourRange: [9, 11],
    },
  ],

  // ─── Occasional bigger-ticket events (finance/expense.generator.ts) ──────

  occasionalEvents: [
    {
      id: "commute",
      merchantIds: ["mer_uber", "mer_metro", "mer_rapido"],
      accountSlugs: ["upi", "cash"],
      amountRangeMilli: [60000, 250000], // ₹60 - ₹250
      probabilityPerMonth: 0.55,
      note: "Commute",
    },
    {
      id: "shopping",
      merchantIds: ["mer_amazon", "mer_flipkart", "mer_myntra", "mer_nykaa"],
      accountSlugs: ["credit_card", "upi"],
      amountRangeMilli: [800000, 3000000], // ₹800 - ₹3,000
      probabilityPerMonth: 0.55,
      note: "Online shopping",
    },
    {
      id: "entertainment",
      merchantIds: ["mer_bookmyshow"],
      accountSlugs: ["credit_card"],
      amountRangeMilli: [40000, 250000], // ₹40 - ₹250
      probabilityPerMonth: 0.45,
      note: "Movies / entertainment",
    },
    {
      id: "electronics",
      merchantIds: ["mer_croma", "mer_decathlon"],
      accountSlugs: ["credit_card"],
      amountRangeMilli: [1500000, 6000000], // ₹1.5K - ₹6K
      probabilityPerMonth: 0.1,
      note: "Electronics purchase",
    },
    {
      id: "medical",
      merchantIds: ["mer_apollo", "mer_medplus"],
      accountSlugs: ["upi", "credit_card"],
      amountRangeMilli: [300000, 1500000], // ₹300 - ₹1.5K
      probabilityPerMonth: 0.2,
      note: "Medicine",
    },
    {
      id: "gift",
      merchantIds: ["mer_amazon", "mer_flipkart"],
      accountSlugs: ["credit_card"],
      amountRangeMilli: [800000, 2500000], // ₹800 - ₹2,500
      probabilityPerMonth: 0.1,
      note: "Gift purchase",
      type: "expense",
    },
    {
      id: "bank_charges",
      merchantIds: ["mer_bank_charges"],
      accountSlugs: ["savings"],
      amountRangeMilli: [5000, 150000], // ₹5 - ₹150 (SMS alert / minor fee)
      probabilityPerMonth: 0.25,
      note: "Bank charges",
    },
    {
      id: "online_course",
      merchantIds: ["mer_udemy", "mer_coursera"],
      accountSlugs: ["credit_card"],
      amountRangeMilli: [400000, 1500000], // ₹400 - ₹1.5K
      probabilityPerMonth: 0.08,
      note: "Online course",
    },
  ],

  // ─── Cashback (finance/cashback.generator.ts) ────────────────────────────

  cashbackEvents: [
    {
      id: "cashback",
      merchantIds: ["mer_cashback_reward"],
      accountSlugs: ["upi"],
      amountRangeMilli: [5000, 40000], // ₹5 - ₹40
      probabilityPerMonth: 0.4,
      note: "Cashback received",
      type: "income",
    },
  ],

  // ─── Refunds (finance/refund.generator.ts) ───────────────────────────────

  refundEvents: [
    {
      id: "order_refund",
      merchantIds: ["mer_order_refund"],
      accountSlugs: ["upi", "credit_card", "savings"],
      amountRangeMilli: [200000, 1200000], // ₹200 - ₹1,200
      probabilityPerMonth: 0.3,
      note: "Order refund",
      type: "income",
    },
    {
      id: "tax_refund",
      merchantIds: ["mer_tax_refund"],
      accountSlugs: ["savings"],
      amountRangeMilli: [3000000, 8000000], // ₹3K - ₹8K (once a year, tax season)
      probabilityPerMonth: 0.05,
      note: "Income tax refund",
      type: "income",
    },
  ],

  // ─── Investment (finance/investment.generator.ts) ────────────────────────

  investments: [
    {
      id: "inv_mf_sip",
      kind: "mutual-fund-sip",
      label: "Parag Parikh Flexi Cap SIP",
      institutionId: "inst_zerodha",
      linkedAccountSlug: "savings",
      monthlyContributionMilli: 10000000, // ₹10K
      startedMonthsAgo: 14,
      approxAnnualGrowthPercent: 12,
    },
  ],

  // ─── Transfers between own accounts (finance/transfer.generator.ts) ─────

  transfers: [
    {
      id: "salary_to_savings",
      fromSlug: "salary",
      toSlug: "savings",
      cadence: "monthly",
      dayOfMonth: 2,
      amountRangeMilli: [70000000, 85000000], // ₹70K - ₹85K
      reason: "Salary transfer to savings",
    },
    {
      id: "upi_topup",
      fromSlug: "savings",
      toSlug: "upi",
      cadence: "monthly",
      dayOfMonth: 7,
      amountRangeMilli: [4000000, 8000000], // ₹4K - ₹8K wallet topup
      reason: "UPI wallet topup",
    },
  ],

  // ─── ATM withdrawals (finance/atm.generator.ts) ──────────────────────────

  atmWithdrawals: [
    {
      fromSlug: "savings",
      toSlug: "cash",
      dayOfMonth: 24,
      amountRangeMilli: [2000000, 4000000], // ₹2K - ₹4K
    },
  ],

  // ─── Credit card bill payment (finance/transfer.generator.ts) ───────────

  cardPayments: [
    {
      fromSlug: "savings",
      cardSlug: "credit_card",
      dayOfMonth: 3,
      payoffRatio: 0.97,
    },
  ],

  // ─── Seasonal multipliers ─────────────────────────────────────────────────

  seasonalMultipliers: [
    {
      id: "festival_season",
      monthsOfYear: [9, 10], // Oct, Nov (Diwali season)
      habitIds: ["all"],
      multiplier: 1.5,
      label: "Festival season spending",
    },
    {
      id: "december_travel_shopping",
      monthsOfYear: [11], // December
      habitIds: ["shopping", "food_delivery"],
      multiplier: 1.4,
      label: "December travel & shopping",
    },
    {
      id: "new_year_quiet",
      monthsOfYear: [0], // January
      habitIds: ["shopping", "food_delivery"],
      multiplier: 0.6,
      label: "Post-holiday quiet period",
    },
  ],

  // ─── Life events: specific, dated, one-time narrative beats ─────────────
  //
  // Scattered across the full 15-month window so no two months feel
  // identical. `monthIndex` is 0-based from the start of the history.

  lifeEvents: [
    {
      id: "phone_purchase",
      monthIndex: 1,
      dayOfMonth: 9,
      type: "expense",
      merchantId: "mer_apple",
      accountSlug: "credit_card",
      amountRangeMilli: [45000000, 65000000], // ₹45K - ₹65K
      label: "New phone purchase",
    },
    {
      id: "vehicle_service",
      monthIndex: 3,
      dayOfMonth: 14,
      type: "expense",
      merchantId: "mer_hp_petrol",
      accountSlug: "upi",
      amountRangeMilli: [1500000, 3500000], // ₹1.5K - ₹3.5K
      label: "Vehicle service",
    },
    {
      id: "laptop_purchase",
      monthIndex: 4,
      dayOfMonth: 15,
      type: "expense",
      merchantId: "mer_apple",
      accountSlug: "credit_card",
      amountRangeMilli: [90000000, 120000000], // ₹90K - ₹1.2L
      label: "MacBook Pro purchase",
    },
    {
      id: "goa_trip",
      monthIndex: 5,
      dayOfMonth: 20,
      type: "expense",
      merchantId: "mer_indigo",
      accountSlug: "credit_card",
      amountRangeMilli: [3500000, 6000000], // ₹3.5K - ₹6K (your share of the trip)
      label: "Goa trip — flights & stay",
    },
    {
      id: "insurance_payment",
      monthIndex: 6,
      dayOfMonth: 11,
      type: "expense",
      merchantId: "mer_star_health",
      accountSlug: "savings",
      amountRangeMilli: [8000000, 14000000], // ₹8K - ₹14K annual premium
      label: "Health insurance premium",
    },
    {
      id: "wedding_gift",
      monthIndex: 7,
      dayOfMonth: 18,
      type: "expense",
      merchantId: "mer_gift_generic",
      accountSlug: "upi",
      amountRangeMilli: [2000000, 5000000], // ₹2K - ₹5K
      label: "Wedding gift",
    },
    {
      id: "home_furniture",
      monthIndex: 8,
      dayOfMonth: 10,
      type: "expense",
      merchantId: "mer_urban_ladder",
      accountSlug: "credit_card",
      amountRangeMilli: [4000000, 8000000], // ₹4K - ₹8K
      label: "Home furniture upgrade",
    },
    {
      id: "festival_shopping",
      monthIndex: 9,
      dayOfMonth: 22,
      type: "expense",
      merchantId: "mer_myntra",
      accountSlug: "credit_card",
      amountRangeMilli: [3000000, 6000000], // ₹3K - ₹6K
      label: "Diwali festival shopping",
    },
    {
      id: "salary_hike_bonus",
      monthIndex: 11,
      dayOfMonth: 25,
      type: "income",
      merchantId: "mer_employer_generic",
      accountSlug: "salary",
      amountRangeMilli: [80000000, 120000000], // ₹80K - ₹1.2L
      label: "Annual performance bonus",
    },
    {
      id: "medical_emergency",
      monthIndex: 12,
      dayOfMonth: 5,
      type: "expense",
      merchantId: "mer_practo",
      accountSlug: "savings",
      amountRangeMilli: [3500000, 7000000], // ₹3.5K - ₹7K
      label: "Medical emergency",
    },
    {
      id: "large_amazon_sale",
      monthIndex: 13,
      dayOfMonth: 8,
      type: "expense",
      merchantId: "mer_amazon",
      accountSlug: "credit_card",
      amountRangeMilli: [4000000, 9000000], // ₹4K - ₹9K (Great Indian Festival-style sale)
      label: "Amazon Great Sale haul",
    },
    {
      id: "freelance_project_bonus",
      monthIndex: 14,
      dayOfMonth: 16,
      type: "income",
      merchantId: "mer_upwork",
      accountSlug: "savings",
      amountRangeMilli: [5000000, 15000000], // ₹5K - ₹15K
      label: "Freelance project payout",
    },
  ],

  // ─── SplitPay ────────────────────────────────────────────────────────────

  splitContacts: [
    { id: "contact_priya", name: "Priya Sharma" },
    { id: "contact_rahul", name: "Rahul Verma" },
    { id: "contact_anita", name: "Anita Desai" },
    { id: "contact_vikram", name: "Vikram Singh" },
    { id: "contact_neha", name: "Neha Kapoor" },
  ],

  splitGroups: [
    {
      id: "group_roommates",
      name: "Roommates",
      icon: "home",
      memberIds: ["contact_priya", "contact_rahul", "contact_neha"],
      expenseDescription: "Shared groceries, food delivery, and rent split three ways.",
      status: "you-owe",
      totalAmountMilli: 42000000, // ₹4,200 total outstanding
      // A real "outstanding" group is rarely uniform — Neha already
      // settled her share this cycle while Priya and Rahul haven't,
      // which is what a "partial settlement" actually looks like.
      memberNetBalanceMilli: {
        contact_priya: -22000000, // you owe Priya ₹2,200
        contact_rahul: -20000000, // you owe Rahul ₹2,000
        contact_neha: 0, // already settled this cycle
      },
    },
    {
      id: "group_colleagues",
      name: "Colleagues",
      icon: "briefcase",
      memberIds: ["contact_anita", "contact_vikram"],
      expenseDescription: "Office lunches, coffee runs, and the occasional movie outing.",
      status: "you-are-owed",
      totalAmountMilli: 18500000, // ₹1,850 total outstanding
      memberNetBalanceMilli: {
        contact_anita: 11000000, // Anita owes you ₹1,100
        contact_vikram: 7500000, // Vikram owes you ₹750
      },
    },
    {
      id: "group_goa_trip",
      name: "Goa Trip",
      icon: "plane",
      memberIds: ["contact_rahul", "contact_vikram", "contact_neha"],
      expenseDescription: "Flights, hotel, and cab fares for a long-weekend trip — fully settled after the group returned.",
      status: "settled",
      totalAmountMilli: 186000000, // ₹18,600 total group spend (history)
      memberNetBalanceMilli: {
        contact_rahul: 0,
        contact_vikram: 0,
        contact_neha: 0,
      },
    },
  ],
};