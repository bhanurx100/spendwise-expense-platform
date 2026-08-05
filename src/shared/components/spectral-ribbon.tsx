'use client'

import { useReducedMotion } from 'framer-motion'
import { useId } from 'react'

/**
 * Purely decorative layered luminous ribbons — NOT financial data.
 * Slow phase drift, low opacity, passes behind hero compositions.
 */
export function SpectralRibbon({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const id = useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 400 140"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id={`rib-v-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#93c5fd" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`rib-c-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0" />
          <stop offset="50%" stopColor="#2563eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <filter id={`rib-blur-${id}`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* Ribbon 1 — blue */}
      <path
        d="M0,84 C60,44 110,110 180,74 C246,40 300,96 400,58"
        fill="none"
        stroke={`url(#rib-v-${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.5"
        filter={`url(#rib-blur-${id})`}
      >
        {!reduced && (
          <animate
            attributeName="d"
            dur="14s"
            repeatCount="indefinite"
            values="M0,84 C60,44 110,110 180,74 C246,40 300,96 400,58;M0,78 C60,52 110,100 180,66 C246,48 300,88 400,64;M0,84 C60,44 110,110 180,74 C246,40 300,96 400,58"
          />
        )}
      </path>

      {/* Ribbon 2 — thinner echo */}
      <path
        d="M0,96 C70,60 120,118 190,86 C258,54 310,104 400,72"
        fill="none"
        stroke={`url(#rib-v-${id})`}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      >
        {!reduced && (
          <animate
            attributeName="d"
            dur="17s"
            repeatCount="indefinite"
            values="M0,96 C70,60 120,118 190,86 C258,54 310,104 400,72;M0,90 C70,68 120,108 190,80 C258,62 310,96 400,78;M0,96 C70,60 120,118 190,86 C258,54 310,104 400,72"
          />
        )}
      </path>

      {/* Ribbon 3 — blue accent */}
      <path
        d="M0,70 C80,96 150,50 220,78 C290,104 340,66 400,84"
        fill="none"
        stroke={`url(#rib-c-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.45"
      >
        {!reduced && (
          <animate
            attributeName="d"
            dur="12s"
            repeatCount="indefinite"
            values="M0,70 C80,96 150,50 220,78 C290,104 340,66 400,84;M0,76 C80,88 150,58 220,84 C290,96 340,72 400,80;M0,70 C80,96 150,50 220,78 C290,104 340,66 400,84"
          />
        )}
      </path>

      {/* Tiny luminous nodes */}
      <circle cx="96" cy="72" r="2.4" fill="#60a5fa" opacity="0.8" />
      <circle cx="212" cy="80" r="2" fill="#2563eb" opacity="0.7" />
      <circle cx="318" cy="82" r="2.4" fill="#3b82f6" opacity="0.65" />
    </svg>
  )
}
