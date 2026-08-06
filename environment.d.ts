export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // neon db url
      DATABASE_URL: string;

      // app base url
      NEXT_PUBLIC_APP_URL: string;

      // google oauth
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;

      // nextauth secret
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
}
