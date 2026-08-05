"use client"

import { useState } from "react"
import { RowSkeleton } from "./RowSkeleton"

export type RowStatus = "idle" | "loading"

interface MethodRowProps {
  icon: React.ReactNode
  label: string
  loadingLabel: string
  onActivate: () => void | Promise<void>
  status?: RowStatus
  /** Shows a "Google" / "Demo" style trailing hint on the resting row, e.g. "Fastest". */
  hint?: string
}

/**
 * src/auth/components/ui/MethodRow.tsx
 *
 * ONE row primitive for every sign-in method, used for both Google and
 * Demo. The old module had a hand-built <GoogleButton> and <DemoButton>
 * that duplicated almost the same button chrome, press state, and loading
 * logic twice — this replaces both, per "never duplicate components /
 * extract reusable primitives."
 *
 * Rows live inside ONE glass-card (via `.glass-row` from globals.css) as
 * a grouped list — the Apple System Settings pattern — rather than two
 * separate floating pill buttons. Loading swaps the row's content for a
 * <RowSkeleton> in place, so nothing about the row's size changes.
 */
export function MethodRow({ icon, label, loadingLabel, onActivate, status = "idle", hint }: MethodRowProps) {
  const [internalStatus, setInternalStatus] = useState<RowStatus>("idle")
  const effectiveStatus = status === "loading" ? "loading" : internalStatus

  async function handleClick() {
    if (effectiveStatus === "loading") return
    setInternalStatus("loading")
    await onActivate()
    // Intentionally not resetting to "idle" here on success — for Google
    // this row's tab is about to navigate away entirely; for Demo, the
    // parent flips to the "success" panel state, so this row unmounts
    // before it would matter.
  }

  if (effectiveStatus === "loading") {
    return <RowSkeleton />
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="glass-row glass-row--interactive flex w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className="flex size-8 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">{label}</span>
      {hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
      <ChevronGlyph />
      <span className="sr-only">{loadingLabel}</span>
    </button>
  )
}

function ChevronGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary, var(--muted-foreground))" strokeWidth="2" aria-hidden="true">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
