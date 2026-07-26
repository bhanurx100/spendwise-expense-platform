"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/src/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// GlassSegment — the shared filter/tab control with the "Focus Bubble."
// Material refinement touches only the track's fill, to match the rest of
// the system: never a flat opaque background, never a filled or outlined
// pill for the INACTIVE state — the only sanctioned color anywhere in this
// component is the active chip's Focus Bubble tint (`.focus-bubble` in
// globals.css).
// ─────────────────────────────────────────────────────────────────────────────

export interface GlassSegmentOption {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface GlassSegmentProps {
  options: GlassSegmentOption[]
  value: string
  onChange: (value: string) => void
  layoutId: string
  className?: string
  fullWidth?: boolean
}

export function GlassSegment({
  options,
  value,
  onChange,
  layoutId,
  className,
  fullWidth = true,
}: GlassSegmentProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "relative items-center gap-1 p-1 rounded-[var(--radius-pill)]",
        "border border-[var(--border)]",
        fullWidth ? "flex w-full" : "inline-flex",
        !fullWidth && "overflow-x-auto scrollbar-none",
        className
      )}
      style={{
        background: "color-mix(in oklab, var(--surface) var(--card-fill-opacity), transparent)",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 px-4 py-2",
              "text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0",
              fullWidth && "flex-1"
            )}
            style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 focus-bubble"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
              {opt.count !== undefined && (
                <span className="opacity-70 tabular-nums">{opt.count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GlassNavIndicator — same Focus Bubble mechanic, scaled down, for the
// bottom navigation's active-tab dot.
// ─────────────────────────────────────────────────────────────────────────────

export function GlassNavIndicator({ layoutId = "bottom-nav-indicator" }: { layoutId?: string }) {
  return (
    <motion.div
      layoutId={layoutId}
      className="absolute -bottom-1 h-1 w-8 rounded-full"
      style={{ background: "var(--primary)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  )
}