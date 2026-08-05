/**
 * scripts/seed/core/balance-sync.ts
 *
 * Installs DB-level guarantees for the accounts.current_balance column:
 *
 *     current_balance = opening_balance + SUM(transactions.amount WHERE account_id = accounts.id)
 *
 * enforced with Postgres triggers so it can never drift out of sync no
 * matter what writes the transactions table afterward (the running app, a
 * future bank-sync job, or someone editing rows by hand).
 *
 * This used to be a separate manual step (`npm run db:sync-balances`)
 * that nobody ran after seeding — which is exactly why "current balances
 * don't reconcile with transaction history" happened. `run-seed.ts` now
 * calls this automatically as its final step, every time, so a fresh seed
 * is never left with a stale `current_balance` column again. The
 * standalone `db:sync-balances` script still exists for re-running this
 * against data seeded by something other than this script.
 *
 * The app's live aggregate query in balance-repository.ts remains the
 * actual source of truth the running app reads from — this column exists
 * so "current balance" is also correct if inspected directly in the
 * database, and is always kept identical to it.
 */

import type { sql as drizzleSql } from "@/src/db/drizzle";

export interface BalanceBackfillRow {
  id: string;
  name: string;
  opening_balance: number;
  current_balance: number;
}

export async function installBalanceSyncAndBackfill(sql: typeof drizzleSql): Promise<BalanceBackfillRow[]> {
  // Defensive: works even if the column hasn't been migrated in yet.
  await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_balance integer NOT NULL DEFAULT 0;`;

  await sql`
    CREATE OR REPLACE FUNCTION recalc_account_balance(p_account_id text) RETURNS void AS $$
    BEGIN
      UPDATE accounts
      SET current_balance = opening_balance + COALESCE(
        (SELECT SUM(amount) FROM transactions WHERE account_id = p_account_id), 0
      )
      WHERE id = p_account_id;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`
    CREATE OR REPLACE FUNCTION trg_transactions_balance_sync() RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        PERFORM recalc_account_balance(OLD.account_id);
        RETURN OLD;
      ELSIF TG_OP = 'UPDATE' THEN
        PERFORM recalc_account_balance(NEW.account_id);
        IF NEW.account_id IS DISTINCT FROM OLD.account_id THEN
          PERFORM recalc_account_balance(OLD.account_id);
        END IF;
        RETURN NEW;
      ELSE
        PERFORM recalc_account_balance(NEW.account_id);
        RETURN NEW;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`DROP TRIGGER IF EXISTS transactions_balance_sync ON transactions;`;
  await sql`
    CREATE TRIGGER transactions_balance_sync
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION trg_transactions_balance_sync();
  `;

  await sql`
    CREATE OR REPLACE FUNCTION trg_accounts_opening_balance_sync() RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
        PERFORM recalc_account_balance(NEW.id);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`DROP TRIGGER IF EXISTS accounts_opening_balance_sync ON accounts;`;
  await sql`
    CREATE TRIGGER accounts_opening_balance_sync
    AFTER UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION trg_accounts_opening_balance_sync();
  `;

  // Backfill every existing account once, so current data is correct
  // immediately rather than waiting for the next transaction write.
  const result = await sql`
    UPDATE accounts
    SET current_balance = opening_balance + COALESCE(
      (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = accounts.id), 0
    )
    RETURNING id, name, opening_balance, current_balance;
  `;

  return result as unknown as BalanceBackfillRow[];
}