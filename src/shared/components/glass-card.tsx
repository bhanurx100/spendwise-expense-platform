"use client"

import React, { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/src/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// GlassCard — the ONE card primitive used everywhere in SplitFin.
// Material refinement pass only: same API as before, `spotlight` now maps to
// the CSS-level `.glow-zone` (see globals.css). It stays a prop name here
// (not renamed) to avoid touching every call site — but it is reserved for
// exactly four places in the whole app:
//
//   Net Worth hero (Overview) · Cash Flow card (Overview) ·
//   Categories orbit hub · Account card carousel
//
// Nowhere else. If you're reaching for `spotlight` on a list row, a button,
// a filter, or the bottom nav — stop, that's the thing this refinement pass
// was written to remove.
// ─────────────────────────────────────────────────────────────────────────────

type GlassRadius = "tile" | "card" | "cardLg" | "pill" | "2xl"
type GlassPadding = "none" | "sm" | "md" | "lg"

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  radius?: GlassRadius
  padding?: GlassPadding
  interactive?: boolean
  selected?: boolean
  /** Ambient blue bloom + tinted border, always on. Reserved for the four
   *  glow-zone elements listed above — never a general "make it pop" prop. */
  spotlight?: boolean
  animated?: boolean
  children?: React.ReactNode
}

const radiusClass: Record<GlassRadius, string> = {
  tile: "rounded-[var(--radius-tile)]",
  card: "rounded-[var(--radius)]",
  cardLg: "rounded-[var(--radius-lg)]",
  pill: "rounded-[var(--radius-pill)]",
  "2xl": "rounded-[1.5rem]",
}

const paddingClass: Record<GlassPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
}

const entranceVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ radius = "card", padding = "md", interactive = false, selected = false, spotlight = false, animated = false, children, className, ...props }, ref) => {
    const card = (
      <motion.div
        ref={ref}
        className={cn(
          spotlight ? "glass-hero" : "glass-card",
          interactive && "glass-card--interactive",
          selected && "glass-card--selected",
          radiusClass[spotlight ? "cardLg" : radius],
          paddingClass[padding],
          className
        )}
        {...(animated ? entranceVariants : {})}
        {...(interactive ? { whileTap: { scale: 0.98, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const } } } : {})}
        {...props}
      >
        {children}
      </motion.div>
    )

    // The glow lives on a wrapper, not the card itself — .glow-zone's ::before
    // paints a soft bloom BEHIND the card (inset: -24px), which only works
    // cleanly from an ancestor, not the card's own overflow:hidden box.
    return spotlight ? <div className="glow-zone">{card}</div> : card
  }
)

GlassCard.displayName = "GlassCard"

// ─────────────────────────────────────────────────────────────────────────────
// GlassContainer — the large frosted "sheet" a group of floating cards sits
// inside. Use sparingly — one per page section, never nested, never itself
// inside a glow-zone (the two effects don't combine).
// ─────────────────────────────────────────────────────────────────────────────

interface GlassContainerProps {
  children: React.ReactNode
  className?: string
}

export function GlassContainer({ children, className }: GlassContainerProps) {
  return (
    <div className={cn("glass-container flex flex-col gap-4", className)}>
      {children}
    </div>
  )
}

interface GlassCardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function GlassCardHeader({ title, subtitle, icon, action, className }: GlassCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--card-foreground)] truncate">{title}</p>
          {subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function GlassCardDivider({ className }: { className?: string }) {
  return <div className={cn("w-full h-px bg-[var(--divider)]", className)} />
}

interface GlassStatCardProps {
  label: string
  value: string
  sublabel?: string
  tone?: "default" | "positive"
  className?: string
}

export function GlassStatCard({ label, value, sublabel, tone = "default", className }: GlassStatCardProps) {
  return (
    <GlassCard radius="card" padding="sm" className={className}>
      <p className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-tight" style={{ color: "var(--primary)" }}>
        {value}
      </p>
      {sublabel && <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{sublabel}</p>}
    </GlassCard>
  )
}