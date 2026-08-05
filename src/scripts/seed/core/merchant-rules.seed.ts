/**
 * scripts/seed/core/merchant-rules.seed.ts
 *
 * The rule table behind "merchant detected → merchant rule checked →
 * category assigned automatically" (see the runtime flow in the project
 * brief). Rules start as system defaults derived 1:1 from the merchant
 * catalog's own categoryId/subcategoryId — `isSystemDefault: true`. A user
 * can later edit a rule (e.g. re-map "Uber" from Cab to Business Travel);
 * that flip to `isSystemDefault: false` is a runtime concern, not a seed
 * concern, but the column exists here so the seed data is shaped exactly
 * like the table a real edit would touch.
 *
 * `resolveMerchant` is the single function every transaction generator in
 * finance/transactions.seed.ts calls — there is no seed-only shortcut that
 * assigns a category without going through a rule, exactly as a real
 * transaction never bypasses this table either.
 */

import { merchants } from "./merchants.seed";
import type { MerchantRule } from "../lib/domain";

export const merchantRules: MerchantRule[] = merchants.map((merchant) => ({
  id: `rule_${merchant.id}`,
  merchantId: merchant.id,
  categoryId: merchant.categoryId,
  subcategoryId: merchant.subcategoryId,
  isSystemDefault: true,
}));

const rulesByMerchantId = new Map(merchantRules.map((r) => [r.merchantId, r]));

export interface ResolvedMerchant {
  merchantId: string;
  categoryId: string;
  subcategoryId: string;
}

/**
 * Resolves a merchant id to its current category/subcategory via the rule
 * table (not the merchant catalog directly) — this is the indirection that
 * lets a user's manual override change categorization without touching the
 * merchant record itself.
 */
export function resolveMerchant(merchantId: string): ResolvedMerchant {
  const rule = rulesByMerchantId.get(merchantId);
  if (!rule) throw new Error(`No merchant rule for merchant: ${merchantId}`);
  return { merchantId, categoryId: rule.categoryId, subcategoryId: rule.subcategoryId };
}