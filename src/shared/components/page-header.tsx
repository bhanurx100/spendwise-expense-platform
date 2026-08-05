'use client'

import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { UserMenu } from '@/src/auth/components/UserMenu'

interface PageHeaderProps {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header aria-label={`${title} page header`}>
      <div className="flex h-14 items-center justify-between">
        <Link href="/" aria-label="SplitFin overview" className="flex min-h-11 items-center gap-2 focus-visible:outline-2 focus-visible:outline-ring">
          <span className="flex size-7 items-center justify-center rounded-[10px] border border-[var(--surface-border)] text-primary">
            <Layers className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[1.625rem] font-semibold tracking-tight">{title}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          <UserMenu />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="mt-3"
      >
        <p className="text-xs leading-4 text-muted-foreground">{subtitle}</p>
      </motion.div>
    </header>
  )
}