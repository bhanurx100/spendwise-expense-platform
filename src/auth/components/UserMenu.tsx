"use client";

import { useAuth } from "@/src/auth/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/src/lib/utils";

/**
 * src/auth/components/UserMenu.tsx
 *
 * Same data and actions as before: `useAuth()` for user/isDemo/signOut,
 * the same Profile/Settings links, the same Logout call. Redesign is
 * presentation-only — more breathing room (per the brief's spacing
 * section), a real open/close transition instead of an instant toggle,
 * and monochrome icons throughout (no colored icon fills at rest).
 */
export function UserMenu() {
  const { user, isDemo, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-sm font-semibold text-[var(--foreground)] transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="size-full object-cover" />
        ) : (
          (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "top right" }}
            className="glass-card absolute right-0 top-11 z-30 w-64 rounded-[var(--radius,20px)] p-2"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-sm font-semibold">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="size-full rounded-full object-cover" />
                ) : (
                  (user.name?.[0] ?? "?").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {user.name}
                  {isDemo && (
                    <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary)]" style={{ backgroundColor: "color-mix(in oklab, var(--primary) 12%, transparent)" }}>
                      Demo
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{user.email}</p>
              </div>
            </div>

            <div className="my-1.5 h-px bg-[var(--divider)]" />

            <MenuItem icon={User} label="Profile" href="/profile" />
            <MenuItem icon={Settings} label="Settings" href="/settings" />
            {/* Reserved for future Security Center work — same as before,
                no new page invented here since none exists yet:
                <MenuItem icon={ShieldCheck} label="Security" href="/settings/security" /> */}

            <div className="my-1.5 h-px bg-[var(--divider)]" />

            <button
              type="button"
              onClick={() => signOut()}
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--hover)]"
              )}
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof User;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      role="menuitem"
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--hover)]"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}
