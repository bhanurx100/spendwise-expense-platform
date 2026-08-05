-- Phase 1 stabilization: close FK gaps + add indexes for the query patterns
-- repositories actually run. Written by hand to match the existing
-- migration style in this project (0003_account_details.sql), which also
-- uses IF NOT EXISTS / non-destructive statements rather than a
-- drizzle-kit-generated snapshot. All statements are safe to re-run.

-- ── Foreign keys ──────────────────────────────────────────────────────────
-- subcategories.user_id, split_groups.user_id, and split_members.user_id
-- were plain text columns with no FK to users.id, unlike accounts.user_id
-- and categories.user_id. This closes that inconsistency so orphaned rows
-- can't be created and ON DELETE CASCADE behaves the same way everywhere
-- a user is deleted.
DO $$ BEGIN
  ALTER TABLE "subcategories"
    ADD CONSTRAINT "subcategories_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "split_groups"
    ADD CONSTRAINT "split_groups_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "split_members"
    ADD CONSTRAINT "split_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Indexes ───────────────────────────────────────────────────────────────
-- Every one of these backs a column that repositories already filter or
-- join on. None existed before (Postgres only auto-indexes primary keys
-- and unique constraints, not plain FK columns).

CREATE INDEX IF NOT EXISTS "accounts_user_id_idx"          ON "accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "categories_user_id_idx"        ON "categories" ("user_id");
CREATE INDEX IF NOT EXISTS "subcategories_user_id_idx"     ON "subcategories" ("user_id");
CREATE INDEX IF NOT EXISTS "subcategories_category_id_idx" ON "subcategories" ("category_id");

-- Composite index backs both:
--   listTransactions()   — WHERE account_id = ? ... ORDER BY date DESC
--   balance-repository   — GROUP BY account_id, SUM(amount)
CREATE INDEX IF NOT EXISTS "transactions_account_id_date_idx" ON "transactions" ("account_id", "date");
CREATE INDEX IF NOT EXISTS "transactions_category_id_idx"     ON "transactions" ("category_id");

CREATE INDEX IF NOT EXISTS "split_groups_user_id_idx"   ON "split_groups" ("user_id");
CREATE INDEX IF NOT EXISTS "split_members_user_id_idx"  ON "split_members" ("user_id");
CREATE INDEX IF NOT EXISTS "split_members_group_id_idx" ON "split_members" ("group_id");
