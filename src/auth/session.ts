import type { DefaultSession } from "next-auth";

/**
 * src/auth/session.ts
 *
 * Type augmentation only. Guarantees `session.user.id` is always the
 * permanent internal UUID (see db/schema.ts `users.id`) — never a Google
 * subject ID. Business code should only ever read `session.user.id`.
 */
declare module "next-auth" {
  interface User {
    isDemo?: boolean;
    status?: string;
  }

  interface Session {
    user: {
      id: string;
      isDemo?: boolean;
      status?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string;
    isDemo?: boolean;
    status?: string;
  }
}

export {};
