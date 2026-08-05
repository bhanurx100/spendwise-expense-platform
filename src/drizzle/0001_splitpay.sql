CREATE TABLE IF NOT EXISTS "split_groups" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "workspace_id" text,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "name" text NOT NULL,
  "emoji_icon" text DEFAULT 'receipt' NOT NULL,
  "status" text DEFAULT 'you-owe' NOT NULL,
  "amount" integer DEFAULT 0 NOT NULL,
  "total_amount" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'INR' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_members" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "group_id" text NOT NULL REFERENCES "split_groups"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "avatar" text NOT NULL,
  "net_balance" integer DEFAULT 0 NOT NULL,
  "direction" text DEFAULT 'settled' NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
