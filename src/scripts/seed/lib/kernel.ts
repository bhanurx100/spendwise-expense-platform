/**
 * scripts/seed/lib/kernel.ts
 *
 * The seed engine's only source of "randomness," time, and identity.
 *
 * SplitFin's seed data is not a demo — it is the canonical financial domain
 * model, exercised through the same shape every real user's data takes.
 * Because of that, seeding must be:
 *
 *   1. DETERMINISTIC — re-running `npm run db:seed` must produce the exact
 *      same ledger for a given persona, so diffs, screenshots, and tests
 *      stay stable. We never call Math.random() directly; every persona
 *      gets its own seeded PRNG derived from its slug.
 *   2. IDEMPOTENT — every record gets a stable, human-readable id
 *      (`{persona}_{domain}_{seq}`) so the orchestrator can upsert instead
 *      of accumulating duplicate rows on every run.
 *   3. OWNED — every entity factory below stamps userId/createdAt/updatedAt/
 *      createdBy/updatedBy (and a nullable workspaceId for future shared
 *      workspaces) automatically, so no domain file can forget ownership.
 */

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────────────

export type Rng = () => number;

function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** Creates a reproducible RNG scoped to a persona (or any string seed). */
export function createRng(seed: string): Rng {
  let a = hashSeed(seed);
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function weightedPick<T>(rng: Rng, entries: ReadonlyArray<[T, number]>): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randAmount(rng: Rng, min: number, max: number, step = 1): number {
  const raw = rng() * (max - min) + min;
  return Math.round(raw / step) * step;
}

/** True with the given probability (0–1), using the persona's own RNG. */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

// ─── Deterministic ids ───────────────────────────────────────────────────────

export function makeId(persona: string, domain: string, seq: number | string): string {
  const suffix = typeof seq === "number" ? String(seq).padStart(4, "0") : seq;
  return `${persona}_${domain}_${suffix}`;
}

// ─── Ownership envelope every seeded record carries ─────────────────────────

export interface OwnedEntity {
  userId: string;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Stamps the ownership envelope onto a record. `at` is the record's own
 * "business" timestamp (e.g. a transaction's date) — createdAt/updatedAt
 * default to it so seeded history doesn't all say "created just now."
 */
export function owned(userId: string, at: Date): OwnedEntity {
  return {
    userId,
    workspaceId: null,
    createdAt: at,
    updatedAt: at,
    createdBy: userId,
    updatedBy: userId,
  };
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function atTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** How many months apart consecutive occurrences of a cadence are. */
export function cadenceStepMonths(cadence: "weekly" | "monthly" | "quarterly" | "yearly"): number {
  switch (cadence) {
    case "weekly":
    case "monthly":
      return 1; // "weekly" recurring *expenses* (rare) are treated as monthly cycles here;
    // true weekly granularity belongs to finance/transactions.seed.ts's spendingHabits engine.
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
  }
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Every day between `from` (inclusive) and `to` (inclusive), ascending. */
export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cur = new Date(from);
  while (cur.getTime() <= to.getTime()) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return days;
}