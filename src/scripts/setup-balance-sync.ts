import "dotenv/config";
import { sql as neonSql } from "@/src/db/drizzle";
import { installBalanceSyncAndBackfill } from "./seed/core/balance-sync";

/**
 * scripts/setup-balance-sync.ts
 *
 * Standalone CLI entrypoint for `installBalanceSyncAndBackfill`
 * (seed/core/balance-sync.ts) — useful for re-running the trigger
 * install/backfill against data seeded or edited by something other than
 * `run-seed.ts`, which now calls the same function automatically as its
 * last step on every run.
 *
 * Run with: npx tsx src/scripts/setup-balance-sync.ts
 */
async function main() {
  const result = await installBalanceSyncAndBackfill(neonSql);
  console.log("✅ Trigger installed. Backfilled current_balance for", result.length, "account(s):");
  for (const row of result) {
    console.log(`   ${row.name}: opening=₹${row.opening_balance / 1000} → current=₹${row.current_balance / 1000}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});