/**
 * scripts/seed/core/subcategories.seed.ts
 *
 * Second-level hierarchy. Every row's categoryId must exist in
 * core/categories.seed.ts — validated in index.ts before any insert runs.
 */

import type { Subcategory } from "../lib/domain";

export const subcategories: Subcategory[] = [
  // Food
  { id: "sub_dining", categoryId: "cat_food", name: "Dining", icon: "utensils" },
  { id: "sub_groceries", categoryId: "cat_food", name: "Groceries", icon: "shopping-cart" },
  { id: "sub_coffee", categoryId: "cat_food", name: "Coffee", icon: "coffee" },
  { id: "sub_fast_food", categoryId: "cat_food", name: "Fast Food", icon: "sandwich" },

  // Travel
  { id: "sub_cab", categoryId: "cat_travel", name: "Cab", icon: "car" },
  { id: "sub_flights", categoryId: "cat_travel", name: "Flights", icon: "plane" },
  { id: "sub_hotels", categoryId: "cat_travel", name: "Hotels", icon: "bed" },
  { id: "sub_fuel", categoryId: "cat_travel", name: "Fuel", icon: "fuel" },
  { id: "sub_transit", categoryId: "cat_travel", name: "Public Transit", icon: "train" },

  // Shopping
  { id: "sub_fashion", categoryId: "cat_shopping", name: "Fashion", icon: "shirt" },
  { id: "sub_electronics", categoryId: "cat_shopping", name: "Electronics", icon: "smartphone" },
  { id: "sub_home", categoryId: "cat_shopping", name: "Home", icon: "sofa" },
  { id: "sub_furniture", categoryId: "cat_shopping", name: "Furniture", icon: "armchair" },
  { id: "sub_home_improvement", categoryId: "cat_shopping", name: "Home Improvement", icon: "hammer" },
  { id: "sub_general_shopping", categoryId: "cat_shopping", name: "General Shopping", icon: "shopping-bag" },

  // Healthcare
  { id: "sub_medicines", categoryId: "cat_healthcare", name: "Medicines", icon: "pill" },
  { id: "sub_doctor", categoryId: "cat_healthcare", name: "Doctor", icon: "stethoscope" },
  { id: "sub_insurance", categoryId: "cat_healthcare", name: "Insurance", icon: "shield" },
  { id: "sub_fitness", categoryId: "cat_healthcare", name: "Fitness", icon: "dumbbell" },

  // Income
  { id: "sub_salary", categoryId: "cat_income", name: "Salary", icon: "briefcase" },
  { id: "sub_bonus", categoryId: "cat_income", name: "Bonus", icon: "gift" },
  { id: "sub_interest", categoryId: "cat_income", name: "Interest", icon: "percent" },
  { id: "sub_client_payment", categoryId: "cat_income", name: "Client Payment", icon: "handshake" },
  { id: "sub_scholarship", categoryId: "cat_income", name: "Scholarship", icon: "graduation-cap" },
  { id: "sub_pocket_money", categoryId: "cat_income", name: "Pocket Money", icon: "wallet" },
  { id: "sub_refund", categoryId: "cat_income", name: "Refund", icon: "rotate-ccw" },
  { id: "sub_cashback", categoryId: "cat_income", name: "Cashback", icon: "badge-percent" },
  { id: "sub_reimbursement", categoryId: "cat_income", name: "Reimbursement", icon: "receipt" },
  { id: "sub_investment_redemption", categoryId: "cat_income", name: "Investment Redemption", icon: "trending-up" },

  // Investment
  { id: "sub_mutual_funds", categoryId: "cat_investment", name: "Mutual Funds", icon: "trending-up" },
  { id: "sub_stocks", categoryId: "cat_investment", name: "Stocks", icon: "candlestick-chart" },
  { id: "sub_crypto", categoryId: "cat_investment", name: "Crypto", icon: "bitcoin" },
  { id: "sub_fixed_deposit", categoryId: "cat_investment", name: "Fixed Deposit", icon: "piggy-bank" },
  { id: "sub_epf", categoryId: "cat_investment", name: "EPF", icon: "landmark" },
  { id: "sub_gold", categoryId: "cat_investment", name: "Gold", icon: "circle-dollar-sign" },

  // Bills & Utilities
  { id: "sub_electricity", categoryId: "cat_bills", name: "Electricity", icon: "zap" },
  { id: "sub_water", categoryId: "cat_bills", name: "Water", icon: "droplet" },
  { id: "sub_internet", categoryId: "cat_bills", name: "Internet", icon: "wifi" },
  { id: "sub_gas", categoryId: "cat_bills", name: "Gas", icon: "flame" },
  { id: "sub_mobile", categoryId: "cat_bills", name: "Mobile", icon: "smartphone" },
  { id: "sub_subscriptions", categoryId: "cat_bills", name: "Subscriptions", icon: "repeat" },
  { id: "sub_bank_charges", categoryId: "cat_bills", name: "Bank Charges", icon: "landmark" },

  // Education
  { id: "sub_courses", categoryId: "cat_education", name: "Courses", icon: "book-open" },
  { id: "sub_books", categoryId: "cat_education", name: "Books", icon: "book" },
  { id: "sub_school_fees", categoryId: "cat_education", name: "School Fees", icon: "graduation-cap" },
  { id: "sub_college_events", categoryId: "cat_education", name: "College Events", icon: "calendar" },

  // Entertainment
  { id: "sub_streaming", categoryId: "cat_entertainment", name: "Streaming", icon: "play" },
  { id: "sub_movies", categoryId: "cat_entertainment", name: "Movies", icon: "clapperboard" },
  { id: "sub_gaming", categoryId: "cat_entertainment", name: "Gaming", icon: "gamepad-2" },

  // Housing
  { id: "sub_rent", categoryId: "cat_housing", name: "Rent", icon: "home" },
  { id: "sub_home_emi", categoryId: "cat_housing", name: "Home EMI", icon: "landmark" },
  { id: "sub_maintenance", categoryId: "cat_housing", name: "Maintenance", icon: "wrench" },

  // Business
  { id: "sub_cloud_infra", categoryId: "cat_business", name: "Cloud Infrastructure", icon: "server" },
  { id: "sub_saas_tools", categoryId: "cat_business", name: "SaaS Tools", icon: "layout-grid" },
  { id: "sub_office_rent", categoryId: "cat_business", name: "Office Rent", icon: "building-2" },
  { id: "sub_taxes", categoryId: "cat_business", name: "Taxes & GST", icon: "receipt" },
  { id: "sub_income_tax", categoryId: "cat_business", name: "Income Tax", icon: "receipt" },
  { id: "sub_property_tax", categoryId: "cat_housing", name: "Property Tax", icon: "receipt" },
  { id: "sub_car_emi", categoryId: "cat_business", name: "Car EMI", icon: "car" },

  // Taxes
  { id: "sub_advance_tax", categoryId: "cat_taxes", name: "Advance Tax", icon: "receipt" },
  { id: "sub_gst", categoryId: "cat_taxes", name: "GST", icon: "receipt" },

  // Transfer
  { id: "sub_internal_transfer", categoryId: "cat_transfer", name: "Internal Transfer", icon: "arrow-left-right" },
  { id: "sub_split_settlement", categoryId: "cat_transfer", name: "Split Settlement", icon: "users" },
  { id: "sub_atm_withdrawal", categoryId: "cat_transfer", name: "ATM Withdrawal", icon: "banknote" },
  { id: "sub_credit_card_payment", categoryId: "cat_transfer", name: "Credit Card Payment", icon: "credit-card" },

  // Others
  { id: "sub_gifts", categoryId: "cat_others", name: "Gifts", icon: "gift" },
  { id: "sub_charity", categoryId: "cat_others", name: "Charity", icon: "hand-heart" },
  { id: "sub_govt_services", categoryId: "cat_others", name: "Government Services", icon: "building" },
  { id: "sub_miscellaneous", categoryId: "cat_others", name: "Miscellaneous", icon: "more-horizontal" },
];

export function getSubcategory(id: string): Subcategory {
  const found = subcategories.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown subcategory: ${id}`);
  return found;
}