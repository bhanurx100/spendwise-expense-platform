import type { Metadata, Viewport } from "next";
import type { PropsWithChildren } from "react";

import { Toaster } from "sonner";

import { AuthProvider } from "@/src/auth/components/AuthProvider";
import { QueryProviders } from "@/src/providers/query-provider";
import { ThemeProvider } from "@/src/providers/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "SplitFin — Take control, split smart, save more",
  description:
    "A premium fintech experience: track transactions, split expenses with friends, understand categories, and manage every account in one place.",
};

export const viewport: Viewport = {
  themeColor: "#04050f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Root layout.
 * - AuthProvider: replaces ClerkProvider — wraps NextAuth's SessionProvider
 *   so useAuth() works anywhere in the tree, including layouts below this one.
 * - QueryProviders: unchanged — React Query client for the kept feature hooks.
 * - ThemeProvider: unchanged — dark/light mode toggle.
 */
const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <AuthProvider>
      <html lang="en" className="dark bg-background">
        <body className="font-sans antialiased">
          <ThemeProvider>
            <QueryProviders>
              {children}
              <Toaster richColors position="top-center" />
            </QueryProviders>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
};

export default RootLayout;
