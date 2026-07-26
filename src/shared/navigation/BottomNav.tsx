'use client'

import { cn } from '@/src/lib/utils'
import { motion } from 'framer-motion'
import { Home, List, PieChart, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/splitpay', label: 'SplitPay', icon: Users },
  { href: '/categories', label: 'Categories', icon: PieChart },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
]

export function BottomNav() {
  const pathname = usePathname()
  const activeAccent = '#3B82F6'

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 z-40 mx-auto max-w-md px-4"
      style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="edge-light flex items-stretch justify-between rounded-3xl border border-border/50 px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
        style={{
          background: 'var(--popover)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-9 min-w-9 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              style={active ? { color: activeAccent } : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: `${activeAccent}18` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative size-5" aria-hidden="true" />
              <span className="relative">{tab.label}</span>
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-0.5 h-0.5 w-6 rounded-full"
                  style={{ backgroundColor: activeAccent, boxShadow: `0 0 12px ${activeAccent}` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
