/**
 * scripts/seed/lib/constants.ts
 *
 * The one "now" every persona's transaction history is generated backwards
 * from. Centralizing it means bumping the demo forward a month is a
 * one-line change, not a hunt through four persona files.
 */

/**
 * The one "now" every persona's transaction history is generated backwards
 * from — computed at seed-run time, not hardcoded, so `npm run db:seed`
 * always produces history through today. A hardcoded past date (this used
 * to be `new Date("2026-07-29T00:00:00.000Z")`) goes stale the moment the
 * real calendar passes it: every screen scoped to "the current month" —
 * the Cash Flow Calendar chief among them — then has no data to show,
 * because no data exists past the frozen reference date.
 */
export const SEED_REFERENCE_DATE = (() => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
})();

/** The stable id-prefix for the one canonical demo user (replaces the old
 *  per-persona `slug` field now that there's only one account). Every
 *  deterministic id in this module is `${DEMO_USER_SLUG}_{domain}_{seq}`. */
export const DEMO_USER_SLUG = "demo";

/** Milliunits per rupee — matches the existing schema's amount convention
 *  (see `convertAmountToMilliunits` in the prior seed-demo.ts). */
export const MILLI = 1000;

export function rupees(amount: number): number {
  return Math.round(amount * MILLI);
}