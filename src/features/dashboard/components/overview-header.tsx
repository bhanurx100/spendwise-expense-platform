"use client"

import { useTheme } from "@/src/providers/theme-provider"
import { GlassCard } from "@/src/shared/components/glass-card"
import { IconButton } from "@/src/shared/components/icon-button"
import type { UserGreeting } from "@/src/types/transaction"
import { Bell, Layers, Moon, Search, Sun } from "lucide-react"
import Link from "next/link"

// Logo mark is monochrome per Section 13 — no gradient fill, no per-brand tint.

export function OverviewHeader({ greeting: _greeting }: { greeting: UserGreeting }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex h-14 items-center justify-between" aria-label="Application header">
      <Link href="/" aria-label="SplitFin overview" className="flex min-h-11 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-ring">
        <GlassCard radius="tile" padding="none" className="flex size-9 items-center justify-center text-[var(--foreground)]">
          <Layers className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
        </GlassCard>
        <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">SplitFin</span>
      </Link>
      <div className="flex gap-2.5">
        <IconButton icon={Search} label="Search" />
        <IconButton icon={theme === "dark" ? Sun : Moon} label="Toggle theme" onClick={toggleTheme} />
        <IconButton icon={Bell} label="Notifications" />
      </div>
    </header>
  )
}