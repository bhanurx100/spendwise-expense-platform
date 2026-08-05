"use client"

import { useEffect } from "react"

interface SuccessTransitionProps {
  callbackUrl: string
  onNavigate: (url: string) => void
}

/**
 * src/auth/components/ui/SuccessTransition.tsx
 *
 * Brief, calm confirmation before handing off to the router — this is the
 * "success transition" the brief asks for. Auto-advances after a fixed
 * beat; there's nothing for the user to act on here, so it's not a state
 * they can get stuck in.
 */
export function SuccessTransition({ callbackUrl, onNavigate }: SuccessTransitionProps) {
  useEffect(() => {
    const t = setTimeout(() => onNavigate(callbackUrl), 550)
    return () => clearTimeout(t)
  }, [callbackUrl, onNavigate])

  return (
    <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
      <div
        className="flex size-12 items-center justify-center rounded-full success-pop"
        style={{ backgroundColor: "color-mix(in oklab, var(--positive) 16%, transparent)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2.5" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">You&apos;re in.</p>
      <p className="text-xs text-[var(--muted-foreground)]">Taking you to your dashboard…</p>
      <style>{`
        .success-pop { animation: success-pop 320ms cubic-bezier(0.4,0,0.2,1); }
        @keyframes success-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .success-pop { animation: none; } }
      `}</style>
    </div>
  )
}
