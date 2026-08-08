import { eq } from "drizzle-orm";
import { db } from "@/src/db/drizzle";
import { users } from "@/src/db/schema";
import { DEMO_ACCOUNT } from "@/src/config/demo-credentials";

/**
 * Resolves the demo identity against the database.
 * Must never throw — Auth.js maps unexpected authorize() throws to
 * `?error=Configuration` for the client.
 */
export async function verifyDemoCredentials(email?: string, password?: string) {
  console.log("[DEMO] verifyDemoCredentials() email=", email ?? "(missing)");

  const isMatch =
    DEMO_ACCOUNT.email.toLowerCase() === (email ?? "").toLowerCase() &&
    DEMO_ACCOUNT.password === password;

  if (!isMatch) {
    console.warn("[DEMO] credentials mismatch");
    return null;
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, DEMO_ACCOUNT.email),
    });

    if (existing) {
      if (existing.status !== "active") {
        console.warn("[DEMO] user exists but status=", existing.status);
        return null;
      }
      console.log("[DEMO] found existing user id=", existing.id);
      return existing;
    }

    // Fallback only — the seed script should already have created this row
    // with the deterministic id from DEMO_ACCOUNT.userId / DEMO_USER_SLUG.
    console.log("[DEMO] no row found — creating demo user id=", DEMO_ACCOUNT.userId);
    const [created] = await db
      .insert(users)
      .values({
        id: DEMO_ACCOUNT.userId,
        email: DEMO_ACCOUNT.email,
        name: DEMO_ACCOUNT.email.split("@")[0],
        provider: "demo",
        isDemo: true,
        status: "active",
      })
      .returning();

    console.log("[DEMO] created user id=", created?.id);
    return created ?? null;
  } catch (err) {
    console.error("[DEMO] DB error during verifyDemoCredentials:", err);
    return null;
  }
}
