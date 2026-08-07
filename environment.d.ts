export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // neon db url
      DATABASE_URL: string;

      // app base url (optional — browser client uses same-origin)
      NEXT_PUBLIC_APP_URL?: string;

      // google oauth (either naming scheme)
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      AUTH_GOOGLE_ID?: string;
      AUTH_GOOGLE_SECRET?: string;

      // Auth.js secrets / URL (AUTH_* preferred; NEXTAUTH_* still supported)
      AUTH_SECRET?: string;
      NEXTAUTH_SECRET?: string;
      AUTH_URL?: string;
      NEXTAUTH_URL?: string;

      // Vercel-provided (never use as NEXTAUTH_URL without https://)
      VERCEL?: string;
      VERCEL_URL?: string;
    }
  }
}
