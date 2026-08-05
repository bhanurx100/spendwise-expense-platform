CREATE TABLE IF NOT EXISTS "subcategories" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "category_id" text NOT NULL REFERENCES "categories"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subcategory_id" text REFERENCES "subcategories"("id") ON DELETE set null;
