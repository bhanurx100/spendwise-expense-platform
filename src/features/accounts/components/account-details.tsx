'use client'

/**
 * Account Details card — PAGE_SPECIFICATIONS.md §04.2/§04.5
 *
 * (This is the same fix as before, just saved under the filename your page
 * actually imports from: `account-details.tsx`, not `account-details-section.tsx`.)
 *
 * Corrections vs. the prior version:
 * - Field icon tiles were a uniform blue tint (bg-primary/12 text-primary).
 *   §04.5 is explicit: "Icon tiles here are monochrome — not tinted per
 *   field type." Switched to the standard monochrome surface-elevated tile.
 * - The card wrapper had a persistent colored glow at rest
 *   (shadow-[0_0_20px_var(--surface-glow)]) — replaced with the shared
 *   hairline border + --shadow-card (§10, §26: no colored glow outside a
 *   press state).
 * - "Negative" tone fields no longer render in red — red is reserved for
 *   destructive actions and overdue status only (§06 rule 6); a negative
 *   here (e.g. a due amount) is neutral foreground text.
 */

import { AnimatedAmount } from '@/src/shared/components/animated-number'
import { SurfaceGroup } from '@/src/shared/components/surface-group'
import type { AccountDetails } from '@/src/types/transaction'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AtSign,
  Banknote,
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Globe,
  Hash,
  Home,
  Landmark,
  MapPin,
  Percent,
  Plane,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  landmark: Landmark,
  hash: Hash,
  'qr-code': QrCode,
  'map-pin': MapPin,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  percent: Percent,
  clock: Clock,
  'check-circle': CheckCircle2,
  'credit-card': CreditCard,
  banknote: Banknote,
  sparkles: Sparkles,
  wallet: Wallet,
  smartphone: Smartphone,
  'at-sign': AtSign,
  'shield-check': ShieldCheck,
  globe: Globe,
  wifi: Wifi,
  home: Home,
  briefcase: Briefcase,
  plane: Plane,
  user: User,
}

export function AccountDetailsSection({ details }: { details: AccountDetails }) {
  return (
    <section aria-label="Account overview" className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[var(--foreground)]">Account Overview</h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={details.accountId}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]"
        >
          {/* Detail grid */}
          <SurfaceGroup className="grid grid-cols-2 gap-x-4 gap-y-4 p-3">
            {details.fields.map((field, i) => {
              const Icon = iconMap[field.icon] ?? Landmark
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 + i * 0.04 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] text-[var(--muted-foreground)]">{field.label}</dt>
                    <dd
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: field.tone === 'positive' ? 'var(--positive)' : 'var(--foreground)' }}
                    >
                      <span className="break-words leading-snug">{field.value}</span>
                      {field.copyable && (
                        <button
                          type="button"
                          aria-label={`Copy ${field.label}`}
                          className="flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                          onClick={() => navigator.clipboard?.writeText(field.value)}
                        >
                          <Copy className="size-3" aria-hidden="true" />
                        </button>
                      )}
                    </dd>
                  </div>
                </motion.div>
              )
            })}
          </SurfaceGroup>

          {/* Balance block */}
          <div className="border-t border-[var(--divider)] pt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{details.primaryAmountLabel}</p>
                <AnimatedAmount
                  value={details.primaryAmount}
                  currency={details.currency}
                  className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted-foreground)]">{details.secondaryAmountLabel}</p>
                <AnimatedAmount
                  value={details.secondaryAmount}
                  currency={details.currency}
                  className="text-sm font-bold text-[var(--foreground)]"
                />
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuenow={details.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={details.primaryAmountLabel}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]"
            >
              <motion.div
                className="h-full rounded-full bg-[var(--primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${details.progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 24 }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">{details.footnoteLabel}</span>
              <span className="font-semibold text-[var(--positive)]">{details.footnoteValue}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}