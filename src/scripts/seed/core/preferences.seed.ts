/**
 * scripts/seed/core/preferences.seed.ts
 *
 * One preferences row per user. Kept intentionally small — this is
 * settings state, not a domain-modeling exercise.
 */

import { owned } from "../lib/kernel";
import type { UserPreferences } from "../lib/domain";

export interface PreferencesBlueprint {
  theme?: "system" | "light" | "dark";
  budgetingStyle?: "envelope" | "fifty-thirty-twenty" | "none";
  notifyBillsDaysBefore?: number;
  weekStartsOn?: "sunday" | "monday";
}

export function buildPreferences(userId: string, joinedOn: Date, bp: PreferencesBlueprint = {}): UserPreferences {
  return {
    theme: bp.theme ?? "system",
    budgetingStyle: bp.budgetingStyle ?? "fifty-thirty-twenty",
    notifyBillsDaysBefore: bp.notifyBillsDaysBefore ?? 3,
    weekStartsOn: bp.weekStartsOn ?? "monday",
    ...owned(userId, joinedOn),
  };
}