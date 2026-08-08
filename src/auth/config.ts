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

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  console.error("[AUTH] Missing AUTH_SECRET / NEXTAUTH_SECRET — Auth.js will return Configuration");
} else {
  console.log("[AUTH] Secret present (source:", process.env.AUTH_SECRET ? "AUTH_SECRET" : "NEXTAUTH_SECRET", ")");
}

const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
if (authUrl) {
  console.log("[AUTH] Canonical URL:", authUrl);
} else {
  console.warn(
    "[AUTH] AUTH_URL / NEXTAUTH_URL unset — relying on trustHost + request headers (OK on Vercel if Host/Proto are correct)"
  );
}

const providers: NextAuthConfig["providers"] = [];

if (googleClientId && googleClientSecret) {
  console.log("[GOOGLE] Provider enabled");
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.error(
    "[GOOGLE] Provider DISABLED — GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (or AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET) missing"
  );
}

providers.push(
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
      console.log("[DEMO] authorize() called");
      try {
        const user = await verifyDemoCredentials(
          creds?.email as string | undefined,
          creds?.password as string | undefined
        );
        if (!user) {
          console.warn("[DEMO] authorize() rejected — invalid credentials or inactive user");
          return null;
        }
        console.log("[DEMO] authorize() ok userId=", user.id);
        // Auth.js Credentials expects a plain user object with a stable id.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isDemo: user.isDemo,
          status: user.status,
        };
      } catch (err) {
        // Never throw — Auth.js maps unexpected throws to ?error=Configuration
        console.error("[DEMO] authorize() failed:", err);
        return null;
      }
    },
  })
);

export const authConfig: NextAuthConfig = {
  adapter: drizzleAdapter,

  session: {
    // JWT strategy is required for Credentials; must stay consistent with
    // callbacks that read/write the token (not the database session row).
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers,

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  callbacks: authCallbacks,

  trustHost: true,
  secret: authSecret,
};
