import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { drizzleAdapter } from "@/src/auth/adapter";
import { authCallbacks } from "@/src/auth/callbacks";
import { verifyDemoCredentials } from "@/src/auth/demo-service";

/**
 * src/auth/config.ts
 *
 * The ONLY file that should ever need an edit to add a new provider.
 * Business code (Hono routes, server components, client hooks) never
 * imports from `next-auth` directly — everything goes through
 * `src/auth/server.ts` and `src/auth/hooks/useAuth.ts`.
 *
 * Only Google is "live" today. The Credentials provider exists solely to
 * carry the demo account through Auth.js's session machinery so demo users
 * get real HttpOnly-cookie sessions, not a DOM-hack autofill.
 *
 * FUTURE PROVIDERS (uncomment / add when ready — no other file changes):
 *   import Apple from "next-auth/providers/apple"
 *   import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
 *   import GitHub from "next-auth/providers/github"
 *   import Nodemailer from "next-auth/providers/nodemailer" // magic link
 *   // Phone OTP and Passkeys/WebAuthn need a custom provider — add under
 *   // src/auth/providers/ when that work starts; config.ts only grows a
 *   // one-line entry in `providers` below.
 */
export const authConfig: NextAuthConfig = {
  adapter: drizzleAdapter,

  session: {
    // JWT strategy for Credentials provider compatibility
    // Database sessions don't work well with Credentials
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Override session strategy for Credentials provider to use JWT
  // since database sessions don't work well with Credentials
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Demo account only. Never shown as a public "sign in with password"
    // option — the sign-in page calls this provider directly for exactly
    // one hardcoded demo identity, resolved server-side.
    Credentials({
      id: "demo",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        return verifyDemoCredentials(creds?.email as string, creds?.password as string);
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  callbacks: authCallbacks,

  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
};
