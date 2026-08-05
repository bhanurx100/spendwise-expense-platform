"use client";

import { MobileShell } from "@/src/shared/components/mobile-shell";
import { PageHeader } from "@/src/shared/components/page-header";

export default function SettingsPage() {
  return (
    <MobileShell>
      <PageHeader title="Settings" subtitle="App preferences" />
      <p className="text-sm text-[var(--muted-foreground)]">Settings coming soon.</p>
    </MobileShell>
  );
}