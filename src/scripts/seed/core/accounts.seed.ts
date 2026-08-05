/**
 * scripts/seed/core/accounts.seed.ts
 *
 * Accounts are persona-specific (a student doesn't have a home loan
 * account, a family does) so this file exports a factory rather than a
 * fixed list — each persona file supplies an AccountBlueprint[] and this
 * turns it into real, owned Account rows.
 */

import { getInstitution } from "./institutions.seed";
import { makeId, owned } from "../lib/kernel";
import type { Account, AccountType } from "../lib/domain";

export interface AccountBlueprint {
  slug: string; // e.g. "primary-savings" — stable within a persona
  institutionId: string;
  name: string;
  type: AccountType;
  currency?: string;
  openingBalanceMilli: number;
  maskedNumber: string;
  linkedToSlug?: string; // resolved to linkedAccountId after all accounts exist
  isPrimary?: boolean;
}

/** The single naming rule for account ids — used both here and by any
 *  finance/splitpay file that needs to reference an account by its
 *  persona-scoped slug without re-deriving the list. */
export function accountId(personaSlug: string, slug: string): string {
  return makeId(personaSlug, "acc", slug);
}

export function buildAccounts(personaSlug: string, userId: string, joinedOn: Date, blueprints: AccountBlueprint[]): Account[] {
  const idBySlug = new Map(blueprints.map((b) => [b.slug, accountId(personaSlug, b.slug)]));

  return blueprints.map((bp) => {
    // Validates the institution exists — fails fast on a typo rather than
    // silently seeding an orphaned foreign key.
    getInstitution(bp.institutionId);

    return {
      id: idBySlug.get(bp.slug)!,
      institutionId: bp.institutionId,
      name: bp.name,
      type: bp.type,
      currency: bp.currency ?? "INR",
      openingBalanceMilli: bp.openingBalanceMilli,
      maskedNumber: bp.maskedNumber,
      linkedAccountId: bp.linkedToSlug ? idBySlug.get(bp.linkedToSlug) ?? null : null,
      isPrimary: bp.isPrimary ?? false,
      ...owned(userId, joinedOn),
    };
  });
}