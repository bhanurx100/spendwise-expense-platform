"use client"

import React from "react"
import { cn } from "@/src/lib/utils"
import { GlassNavIndicator } from "./glass-segment"

// ─────────────────────────────────────────────────────────────────────────────
// GlassNavigation — bottom tab bar. Material spec, exactly:
//
//   Graphite glass, floating        → .glass-nav (own radius + shadow, not
//                                      flush to the screen edge)
//   Hairline border                 → yes (.glass-nav)
//   Background glow                 → NO — deliberately NOT wrapped in
//                                      .glow-zone; the nav is one of the
//                                      four things the glow map excludes.
//   Active indicator                → blue Focus Bubble dot (GlassNavIndicator)
//   Icons                           → monochrome always; only the active
//                                      icon + label take --primary, via
//                                      color, never a fill/background.
//
// Render this ONCE, at the app-shell level (e.g. inside MobileShell), not
// per-page — rendering it from both the shell and a page is what caused
// the earlier overlap bug. Pages should add `.pb-nav` to their scrollable
// container so content clears the floating bar.
// ─────────────────────────────────────────────────────────────────────────────

export interface GlassNavItem {
  value: string
  label: string
  icon: React.ReactNode
  id: string
  href: string
}

interface GlassNavigationProps {
  items: GlassNavItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function GlassNavigation({ items, value, onChange, className }: GlassNavigationProps) {
  return (
    <nav
      className={cn(
        "glass-nav fixed left-4 right-4 flex items-center justify-around px-2 py-2",
        className
      )}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 min-w-[44px] min-h-[44px] justify-center"
            aria-current={active ? "page" : undefined}
          >
            <span
              className="w-6 h-6 flex items-center justify-center transition-colors duration-150"
              style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              {item.icon}
            </span>
            <span
              className="text-[11px] font-medium transition-colors duration-150"
              style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
            >
              {item.label}
            </span>
            {active && <GlassNavIndicator layoutId="bottom-nav-indicator" />}
          </button>
        )
      })}
    </nav>
  )
}