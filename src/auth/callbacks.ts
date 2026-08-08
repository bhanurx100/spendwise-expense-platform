import type { NextAuthConfig } from "next-auth";

import { db } from "@/src/db/drizzle";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/**
 * src/auth/callbacks.ts
 *
 * With JWT strategy, we need to handle jwt callback to persist user data
 * in the token, and session callback to read from token instead of database.
 */
type AuthUserFields = {
  id?: string;
  email?: string | null;
  isDemo?: boolean;
  status?: string;
};

export const authCallbacks: NextAuthConfig["callbacks"] = {
  async jwt({ token, user, trigger, session, account }) {
    // Initial sign in: persist user data in token
    if (user) {
      const u = user as AuthUserFields;
      token.id = u.id ?? token.sub;
      token.isDemo = Boolean(u.isDemo);
      token.status = u.status ?? "active";
      token.email = u.email ?? token.email;
      console.log(
        "[AUTH] jwt() sign-in",
        "provider=",
        account?.provider ?? "unknown",
        "userId=",
        token.id,
        "isDemo=",
        token.isDemo
      );
    }

    // Handle session updates
    if (trigger === "update" && session) {
      token = { ...token, ...session };
      console.log("[AUTH] jwt() update userId=", token.id);
    }

    // Ensure id is always present for API ownership filters
    if (!token.id && token.sub) {
      token.id = token.sub;
    }

    return token;
  },

  async session({ session, token }) {
    // Read user data from token instead of database
    if (token && session.user) {
      session.user.id = (token.id as string) ?? (token.sub as string);
      session.user.isDemo = Boolean(token.isDemo);
      session.user.status = (token.status as string) ?? "active";
      if (token.email) session.user.email = token.email as string;
    }
    // Compact — this callback runs on nearly every authenticated request.
    if (!session.user?.id) {
      console.warn("[AUTH] session() missing user id on token");
    }
    return session;
  },

  async signIn({ user, account }) {
    const provider = account?.provider ?? "unknown";
    const tag = provider === "google" ? "[GOOGLE]" : provider === "demo" ? "[DEMO]" : "[AUTH]";
    console.log(tag, "signIn()", "userId=", user?.id ?? "none", "email=", user?.email ?? "none");

    if (!user?.id) return true;

    // Fire-and-forget — never block sign-in on this write.
    // Wrap so a rejected promise never surfaces as Configuration.
    void db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id))
      .then(() => {
        console.log(tag, "lastLogin updated for", user.id);
      })
      .catch((err) => {
        console.warn(tag, "lastLogin update failed (non-fatal):", err);
      });

    return true;
  },
};
