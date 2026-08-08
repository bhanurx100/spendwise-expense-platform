import { hc } from "hono/client";

import { AppType } from "@/src/app/api/[[...route]]/route";

/**
 * Resolve the API base URL without hardcoding hosts.
 *
 * Browser: always same-origin so cookies/session travel with every request
 * (fixes empty dashboards when NEXT_PUBLIC_APP_URL pointed at another host).
 *
 * Server: prefer NEXT_PUBLIC_APP_URL, then AUTH/NEXTAUTH URL, then Vercel
 * https host, then local dev — never a protocol-less VERCEL_URL alone.
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl) {
    try {
      return new URL(authUrl).origin;
    } catch {
      /* fall through */
    }
  }

  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

/**
 * Lazy proxy so the origin is resolved when a method is accessed (client
 * navigations / SSR), not once at module-eval with a stale host.
 */
export const client = new Proxy({} as ReturnType<typeof hc<AppType>>, {
  get(_target, prop, receiver) {
    const instance = hc<AppType>(getBaseUrl(), {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        });
      },
    });

    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});