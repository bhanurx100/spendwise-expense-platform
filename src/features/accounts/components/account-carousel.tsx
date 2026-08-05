'use client'

/**
 * Account carousel — sized/staged to fix the "everything looks the same
 * tiny flat size" bug:
 *
 * - The track is capped at max-w-[420px] so it can never render wider than
 *   a phone column even in an unconstrained preview — this was the actual
 *   cause of cards looking tiny/flat (many similarly-scaled cards fitting
 *   side by side in a too-wide track).
 * - The active card is sized like a real card (up to 300px, 1.586:1 ratio —
 *   actual credit-card proportions via aspect-ratio, not a guessed height).
 * - Falloff for non-active cards now actually recedes (scale down to 0.62,
 *   opacity down to 0.12) instead of floors that kept every card almost
 *   equally visible.
 * - No negative margin / edge bleed anywhere — the track sits in the
 *   page's normal padding, same as every other section.
 * - The active card is the one sanctioned "glow-zone" element for this
 *   page (globals.css glow map) — black glass-hero fill + the blue bloom
 *   anchored top-left is what gives the "light blue on one side" glass
 *   look. Inactive cards are plain glass-hero, no bloom.
 */

import { formatCurrency } from '@/src/shared/lib/format'
import { cn } from '@/src/lib/utils'
import type { AccountPreview, AccountType } from '@/src/types/transaction'
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import { Banknote, CreditCard, Landmark, TrendingUp, Wallet, Wifi, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

export type CarouselAccount = AccountPreview & {
  holderName?: string
  validThru?: string
  network?: 'visa' | 'rupay' | 'mastercard'
}

const TYPE_ICON: Record<AccountType, LucideIcon> = {
  bank: Landmark,
  'credit-card': CreditCard,
  'debit-card': CreditCard,
  wallet: Wallet,
  cash: Banknote,
  investment: TrendingUp,
}

const TYPE_LABEL: Record<AccountType, string> = {
  bank: 'Savings Account',
  'credit-card': 'Credit Card',
  'debit-card': 'Debit Card',
  wallet: 'Wallet',
  cash: 'Cash in Hand',
  investment: 'Investment',
}

function NetworkMark({ network }: { network?: CarouselAccount['network'] }) {
  if (network === 'visa') {
    return <span className="text-[14px] font-black italic leading-none text-white">VISA</span>
  }
  if (network === 'rupay') {
    return (
      <span className="text-[12px] font-extrabold leading-none">
        <span className="text-white">Ru</span>
        <span className="text-[var(--primary-bright)]">Pay</span>
      </span>
    )
  }
  if (network === 'mastercard') {
    return (
      <span className="flex -space-x-1.5" aria-hidden="true">
        <span className="size-3 rounded-full bg-[#EB001B] opacity-90" />
        <span className="size-3 rounded-full bg-[#F79E1B] opacity-90 mix-blend-screen" />
      </span>
    )
  }
  return null
}

function CardContent({ account }: { account: CarouselAccount }) {
  const Icon = TYPE_ICON[account.type]
  const isCredit = account.type === 'credit-card'
  const isWalletLike = account.type === 'wallet' || account.type === 'cash'
  const balanceCaption = isCredit ? 'Outstanding' : isWalletLike ? 'Balance' : 'Available Balance'

  return (
    <div className="relative z-[1] flex h-full flex-col justify-between p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] text-[var(--foreground)]">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-bold leading-tight text-[var(--foreground)]">
                {account.institution}
              </p>
              {account.isPrimary && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold text-[var(--primary-bright)]"
                  style={{ background: 'color-mix(in oklab, var(--primary) 14%, transparent)' }}
                >
                  Primary
                </span>
              )}
            </div>
            <p className="text-[10px] leading-tight text-[var(--muted-foreground)]">{TYPE_LABEL[account.type]}</p>
          </div>
        </div>
        <Wifi className="size-3.5 shrink-0 rotate-90 text-[var(--muted-foreground)]" aria-hidden="true" />
      </div>

      {account.maskedNumber && (
        <p className="relative text-[13px] tracking-[0.18em] tabular-nums text-[var(--muted-foreground)]">
          •••• {account.maskedNumber}
        </p>
      )}

      <div>
        <p className="text-[22px] font-extrabold leading-none tabular-nums text-[var(--foreground)]">
          {formatCurrency(isCredit ? Math.abs(account.balance) : account.balance, account.currency)}
        </p>
        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{balanceCaption}</p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-wider text-[var(--muted-foreground)]">
            {isWalletLike ? 'UPI ID' : 'Card Holder'}
          </p>
          <p className="truncate text-[10px] font-semibold text-[var(--foreground)]">{account.holderName ?? '—'}</p>
        </div>
        {!isWalletLike && account.validThru && (
          <div className="shrink-0 text-right">
            <p className="text-[8px] uppercase tracking-wider text-[var(--muted-foreground)]">Valid Thru</p>
            <p className="text-[10px] font-semibold tabular-nums text-[var(--foreground)]">{account.validThru}</p>
          </div>
        )}
        <div className="shrink-0">
          <NetworkMark network={account.network} />
        </div>
      </div>
    </div>
  )
}

function CardSlot({
  index,
  offset,
  active,
  account,
}: {
  index: number
  offset: MotionValue<number>
  active: boolean
  account: CarouselAccount
}) {
  const x = useTransform(offset, (o) => `calc(-50% + ${(index - o) * 82}%)`)
  const scale = useTransform(offset, (o) => Math.max(0.62, 1 - Math.abs(index - o) * 0.22))
  const opacity = useTransform(offset, (o) => Math.max(0.12, 1 - Math.abs(index - o) * 0.55))
  const zIndex = useTransform(offset, (o) => Math.round(10 - Math.abs(index - o)))

  return (
    <motion.div
      role="option"
      aria-selected={active}
      className={cn(
        'absolute left-1/2 top-0 aspect-[1.586/1] w-[86%] max-w-[300px]',
        active && 'glow-zone',
      )}
      style={{ x, scale, opacity, zIndex }}
    >
      <div className="glass-hero h-full w-full">
        <CardContent account={account} />
      </div>
    </motion.div>
  )
}

export function AccountCarousel({
  accounts,
  activeIndex,
  onActiveChange,
  requestedIndex,
  onRequestIndex,
}: {
  accounts: CarouselAccount[]
  activeIndex: number
  onActiveChange: (index: number) => void
  requestedIndex?: number
  onRequestIndex?: (index: number) => void
}) {
  const offset = useMotionValue(activeIndex)
  const physics = useRef({ target: activeIndex, velocity: 0, dragging: false })
  const drag = useRef({ startX: 0, startOffset: 0, lastX: 0, lastT: 0, pxVelocity: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const lastReported = useRef(activeIndex)
  const reduceMotion = useReducedMotion()

  const clampIndex = (i: number) => Math.max(0, Math.min(accounts.length - 1, i))

  useEffect(() => {
    if (requestedIndex === undefined) return
    physics.current.target = clampIndex(requestedIndex)
    physics.current.velocity = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedIndex, accounts.length])

  useAnimationFrame((_, delta) => {
    const s = physics.current
    if (s.dragging) return
    const current = offset.get()

    if (reduceMotion) {
      if (current !== s.target) {
        offset.set(s.target)
        if (lastReported.current !== s.target) {
          lastReported.current = s.target
          onActiveChange(s.target)
        }
      }
      return
    }

    const dt = Math.min(delta / 1000, 0.05)
    const diff = s.target - current
    s.velocity += diff * 24 * dt
    s.velocity *= Math.exp(-6.4 * dt)
    const next = current + s.velocity * dt

    if (Math.abs(diff) < 0.002 && Math.abs(s.velocity) < 0.01) {
      offset.set(s.target)
      s.velocity = 0
      if (lastReported.current !== s.target) {
        lastReported.current = s.target
        onActiveChange(s.target)
      }
    } else {
      offset.set(next)
    }
  })

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    physics.current.dragging = true
    drag.current = { startX: e.clientX, startOffset: offset.get(), lastX: e.clientX, lastT: performance.now(), pxVelocity: 0 }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!physics.current.dragging) return
    const width = containerRef.current?.clientWidth || 320
    const dx = e.clientX - drag.current.startX
    const raw = drag.current.startOffset - dx / (width * 0.62)
    const min = 0
    const max = accounts.length - 1
    offset.set(raw < min ? min + (raw - min) * 0.3 : raw > max ? max + (raw - max) * 0.3 : raw)

    const now = performance.now()
    const dt = now - drag.current.lastT
    if (dt > 0) {
      drag.current.pxVelocity = (e.clientX - drag.current.lastX) / dt
      drag.current.lastX = e.clientX
      drag.current.lastT = now
    }
  }

  const endDrag = () => {
    if (!physics.current.dragging) return
    physics.current.dragging = false
    const flick = drag.current.pxVelocity
    let target = Math.round(offset.get())
    if (Math.abs(flick) > 0.35) {
      target = flick < 0 ? Math.ceil(offset.get()) : Math.floor(offset.get())
    }
    target = clampIndex(target)
    physics.current.target = target
    onRequestIndex?.(target)
  }

  const jumpTo = (i: number) => {
    const target = clampIndex(i)
    physics.current.target = target
    physics.current.velocity = 0
    onRequestIndex?.(target)
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
      <div
        ref={containerRef}
        role="listbox"
        aria-label="Your accounts — swipe or use arrow keys to change account"
        tabIndex={0}
        className="relative h-[190px] w-full touch-pan-y select-none overflow-hidden focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') jumpTo(physics.current.target + 1)
          else if (e.key === 'ArrowLeft') jumpTo(physics.current.target - 1)
        }}
      >
        {accounts.map((account, i) => (
          <CardSlot key={account.id} index={i} offset={offset} active={i === activeIndex} account={account} />
        ))}
      </div>

      <div className="flex justify-center gap-1.5" role="tablist" aria-label="Choose account">
        {accounts.map((account, i) => (
          <button
            key={account.id}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`${account.institution} ${account.name}`}
            onClick={() => jumpTo(i)}
            className="flex min-h-6 min-w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          >
            <span
              aria-hidden="true"
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '20px' : '6px',
                background: i === activeIndex ? 'var(--primary)' : 'var(--muted-foreground)',
                opacity: i === activeIndex ? 1 : 0.4,
              }}
            />
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        Selected account: {accounts[activeIndex]?.institution} {accounts[activeIndex]?.name}
      </p>
    </div>
  )
}