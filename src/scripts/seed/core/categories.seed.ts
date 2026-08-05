/**
 * scripts/seed/core/categories.seed.ts
 *
 * Global top-level categories. One flat table; scripts/seed/core/subcategories.seed.ts
 * holds the second level. Every merchant (core/merchants.seed.ts) resolves to
 * exactly one category + subcategory through a MerchantRule — categories are
 * never assigned to a transaction by hand in persona files.
 */

import type { Category } from "../lib/domain";

export const categories: Category[] = [
  { id: "cat_food", name: "Food", icon: "utensils", kind: "expense" },
  { id: "cat_travel", name: "Travel", icon: "plane", kind: "expense" },
  { id: "cat_shopping", name: "Shopping", icon: "shopping-bag", kind: "expense" },
  { id: "cat_healthcare", name: "Healthcare", icon: "heart-pulse", kind: "expense" },
  { id: "cat_income", name: "Income", icon: "briefcase", kind: "income" },
  { id: "cat_investment", name: "Investment", icon: "trending-up", kind: "expense" },
  { id: "cat_bills", name: "Bills & Utilities", icon: "file-text", kind: "expense" },
  { id: "cat_education", name: "Education", icon: "book-open", kind: "expense" },
  { id: "cat_entertainment", name: "Entertainment", icon: "play", kind: "expense" },
  { id: "cat_housing", name: "Housing", icon: "home", kind: "expense" },
  { id: "cat_business", name: "Business", icon: "briefcase", kind: "expense" },
  { id: "cat_taxes", name: "Taxes", icon: "receipt", kind: "expense" },
  { id: "cat_transfer", name: "Transfer", icon: "landmark", kind: "transfer" },
  { id: "cat_others", name: "Others", icon: "more-horizontal", kind: "expense" },
];

export function getCategory(id: string): Category {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category: ${id}`);
  return found;
}