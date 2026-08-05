ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'bank';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "institution" text NOT NULL DEFAULT '';
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "opening_balance" integer NOT NULL DEFAULT 0;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "masked_number" text;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "is_primary" boolean NOT NULL DEFAULT false;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "linked_account_id" text;