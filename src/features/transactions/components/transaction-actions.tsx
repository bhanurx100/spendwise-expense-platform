'use client'

import { QuickActions, type QuickAction } from '@/src/shared/components/quick-actions'
import { Camera, Download, Plus, Upload } from 'lucide-react'

const actions: QuickAction[] = [
  { id: 'import', icon: Upload, label: 'Import', hint: 'CSV / UPI', tone: 'primary' },
  { id: 'scan', icon: Camera, label: 'Scan Bill', hint: 'Auto capture', tone: 'primary' },
  { id: 'add', icon: Plus, label: 'Add', hint: 'Transaction', tone: 'primary' },
  { id: 'export', icon: Download, label: 'Export', hint: 'Statement', tone: 'primary' },
]

/**
 * Premium circular shortcuts — identical interaction language to the
 * Overview quick actions (hover lift, glow interpolation, ripple, spring).
 */
export function TransactionActions() {
  return (
    <section aria-label="Transaction actions">
      <QuickActions actions={actions} />
    </section>
  )
}
