"use client";

import { useAuth } from "@/src/auth/hooks/useAuth";
import { MobileShell } from "@/src/shared/components/mobile-shell";
import { PageHeader } from "@/src/shared/components/page-header";
import { GlassCard } from "@/src/shared/components/glass-card";
import { LogOut, Mail, Shield, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { user, isDemo, isLoading, signOut } = useAuth();

  if (isLoading || !user) {
    return (
      <MobileShell>
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">Loading profile…</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <PageHeader title="Profile" subtitle="Your account details" />

      <GlassCard radius="cardLg" padding="lg" className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-2xl font-semibold text-[var(--foreground)]">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="size-full object-cover" />
          ) : (
            (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div>
          <p className="flex items-center justify-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            {user.name}
            {isDemo && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]"
                style={{ backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
              >
                Demo Account
              </span>
            )}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
        </div>
      </GlassCard>

      <GlassCard radius="cardLg" padding="none" className="divide-y divide-[var(--divider)]">
        <ProfileRow icon={UserIcon} label="Display name" value={user.name ?? "—"} />
        <ProfileRow icon={Mail} label="Email" value={user.email ?? "—"} />
        <ProfileRow icon={Shield} label="Account type" value={isDemo ? "Demo" : "Google"} />
      </GlassCard>

      <button
        type="button"
        onClick={() => signOut()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-5 text-sm font-semibold text-[var(--destructive)] transition-colors hover:bg-[var(--hover)]"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </MobileShell>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="truncate text-sm font-medium text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}