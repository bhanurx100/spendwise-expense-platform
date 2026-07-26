'use client'

import { formatCurrency } from '@/src/shared/lib/format'
import type { Currency } from '@/src/types/transaction'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedAmountProps {
  value: number
  currency?: Currency
  signed?: boolean
  className?: string
  hidden?: boolean
  style?: React.CSSProperties
}

export function AnimatedAmount({
  value,
  currency = 'INR',
  signed,
  className,
  hidden,
}: AnimatedAmountProps) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(reduced ? value : 0)

  // Count-up starts on mount — more reliable than viewport observers
  // inside nested scroll containers and iframes.
  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduced, mv])

  return (
    <span data-amount className={className} aria-label={formatCurrency(value, currency, { signed })}>
      {hidden ? '••••••' : formatCurrency(display, currency, { signed })}
    </span>
  )
}
