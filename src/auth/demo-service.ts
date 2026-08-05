import { eq } from "drizzle-orm";
import { db } from "@/src/db/drizzle";
import { users } from "@/src/db/schema";
import { DEMO_ACCOUNT } from "@/src/config/demo-credentials";

export async function verifyDemoCredentials(email?: string, password?: string) {
  const isMatch =
    DEMO_ACCOUNT.email.toLowerCase() === (email ?? "").toLowerCase() &&
    DEMO_ACCOUNT.password === password;
  if (!isMatch) return null;

  const existing = await db.query.users.findFirst({ where: eq(users.email, DEMO_ACCOUNT.email) });
  if (existing) {
    return existing.status === "active" ? existing : null;
  }

  // Fallback only — the seed script should already have created this row
  // with the deterministic id from DEMO_ACCOUNT.userId / DEMO_USER_SLUG.
  const [created] = await db.insert(users).values({
    id: DEMO_ACCOUNT.userId,
    email: DEMO_ACCOUNT.email,
    name: DEMO_ACCOUNT.email.split("@")[0],
    provider: "demo",
    isDemo: true,
    status: "active",
  }).returning();
  return created;
}