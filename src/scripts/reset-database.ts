import "dotenv/config";
import { sql } from "@/src/db/drizzle";

/**
 * scripts/reset-database.ts
 *
 * Full wipe of every table this app owns. This is the fix for the class of
 * bug where the database stops "reflecting properly": stray rows left
 * behind by old, now-deleted throwaway scripts (a `demo_user_001` /
 * `demo@example.com` user with a handful of hand-written transactions,
 * created by the since-removed `simple-seed.ts` / root `seed-*.js`
 * scripts) sit in the same tables the real seed pipeline reads from, so
 * the UI ends up mixing — or only ever showing — that leftover fixture
 * data instead of the rich generated dataset.
 *
 * `run-seed.ts` only deletes rows scoped to the one demo user it knows
 * about (`DEMO_ACCOUNT.userId`), which is correct for normal re-seeding
 * but by design does NOT touch unrelated rows under a different user id.
 * This script is the blunt instrument for local/demo environments: it
 * truncates every table unconditionally, including auth/session tables,
 * so there is nothing left over from any previous script, experiment, or
 * manually-inserted row. It is intentionally NOT wired into `db:seed` —
 * run it explicitly (`npm run db:reset`) when you want a clean slate,
 * then re-seed.
 *
 * This script also drops four tables that a since-deleted legacy
 * migration script (`apply-manual-migration.ts`) created directly against
 * the database — `currencies`, `institutions`, `merchants`, and
 * `merchant_rules`. Those were never part of `src/db/schema.ts`: the
 * current architecture treats institutions/merchants/merchant-rules as an
 * in-memory seed-time catalog (`src/scripts/seed/core/*.seed.ts`), not a
 * persisted table. Their presence in the database is itself a source of
 * schema drift against what `drizzle-kit push`/`migrate` expects, so this
 * script removes them entirely rather than truncating them.
 *
 * Never run this against a database holding real (non-demo) user data.
 *
 * Run with: npm run db:reset
 */

const OWNED_TABLES = [
  "split_members",
  "split_groups",
  "transactions",
  "subcategories",
  "categories",
  "accounts",
  "sessions",
  "auth_accounts",
  "verification_tokens",
  "users",
] as const;

const LEGACY_UNTRACKED_TABLES = [
  "merchant_rules",
  "merchants",
  "institutions",
  "currencies",
] as const;

async function main() {
  console.log("⚠️  Resetting database — every row in every app table will be deleted.\n");

  for (const table of LEGACY_UNTRACKED_TABLES) {
    await sql(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    console.log(`   dropped legacy table (if present): ${table}`);
  }

  // One statement, one round trip, correct regardless of FK ordering.
  const tableList = OWNED_TABLES.map((t) => `"${t}"`).join(", ");
  await sql(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

  console.log(`\n✅ Truncated: ${OWNED_TABLES.join(", ")}`);
  console.log("   Run `npm run db:seed` next to repopulate the demo dataset.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
