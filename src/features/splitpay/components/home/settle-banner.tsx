'use client'

import { GlassCard } from '@/src/shared/components/glass-card'
import { springs } from '@/src/shared/lib/motion'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// SettleBanner — one GlassCard, one accent (blue). No idle glow (glow is
// press-only per DESIGN_SYSTEM.md §05.9 / --glow-press), no purple/cyan
// gradient wash. The CTA button is allowed to sit in solid --primary since
// it's the page's single interactive call-to-action, not decoration.
// ─────────────────────────────────────────────────────────────────────────────

export function SettleBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={springs.soft}
    >
      <GlassCard radius="card" padding="md" className="flex items-center gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
          <Zap className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--card-foreground)]">Settle up instantly</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Use UPI to settle your dues in one tap</p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2"
        >
          Settle Now
          <ArrowRight className="size-4" aria-hidden="true" />
        </motion.button>
      </GlassCard>
    </motion.div>
  )
}