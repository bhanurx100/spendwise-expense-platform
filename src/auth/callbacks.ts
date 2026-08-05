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
export const authCallbacks: NextAuthConfig["callbacks"] = {
  async jwt({ token, user, trigger, session }) {
    // Initial sign in: persist user data in token
    if (user) {
      token.id = user.id;
      token.isDemo = (user as typeof users.$inferSelect).isDemo;
      token.status = (user as typeof users.$inferSelect).status;
      token.email = user.email;
    }
    
    // Handle session updates
    if (trigger === "update" && session) {
      token = { ...token, ...session };
    }
    
    return token;
  },

  async session({ session, token }) {
    // Read user data from token instead of database
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.isDemo = token.isDemo as boolean;
      session.user.status = token.status as string;
      session.user.email = token.email as string;
    }
    return session;
  },

  async signIn({ user }) {
    if (!user.id) return true;
    // Fire-and-forget — never block sign-in on this write.
    db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id))
      .catch(() => {
        /* non-fatal: last-login tracking is best-effort */
      });
    return true;
  },
};
