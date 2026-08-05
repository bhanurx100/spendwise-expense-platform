'use client'

import { QuickActions, type QuickAction } from '@/src/shared/components/quick-actions'
import { Camera, Download, ListChecks, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { TransactionFormModal } from './transaction-form-modal'
import { TransactionManagerModal } from './transaction-manager-modal'

/**
 * Premium circular shortcuts — identical interaction language to the
 * Overview quick actions (hover lift, glow interpolation, ripple, spring).
 *
 * "Add" opens the create-transaction form; "Manage" opens the edit/delete
 * list. Import/Scan/Export are out of scope for Phase 1 (CSV parsing, OCR,
 * and statement export are separate features) and intentionally left
 * without a handler — same as before this pass, just not silently implying
 * they work.
 */
export function TransactionActions() {
  const [formOpen, setFormOpen] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)

  const actions: QuickAction[] = [
    { id: 'import', icon: Upload, label: 'Import', hint: 'CSV / UPI', tone: 'primary' },
    { id: 'scan', icon: Camera, label: 'Scan Bill', hint: 'Auto capture', tone: 'primary' },
    { id: 'add', icon: Plus, label: 'Add', hint: 'Transaction', tone: 'primary', onClick: () => setFormOpen(true) },
    { id: 'manage', icon: ListChecks, label: 'Manage', hint: 'Edit / delete', tone: 'primary', onClick: () => setManagerOpen(true) },
    { id: 'export', icon: Download, label: 'Export', hint: 'Statement', tone: 'primary' },
  ]

  return (
    <section aria-label="Transaction actions">
      <QuickActions actions={actions} />
      <TransactionFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <TransactionManagerModal open={managerOpen} onClose={() => setManagerOpen(false)} />
    </section>
  )
}
