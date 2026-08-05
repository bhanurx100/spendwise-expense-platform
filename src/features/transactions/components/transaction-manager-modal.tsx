'use client'

/**
 * features/transactions/components/transaction-manager-modal.tsx
 *
 * Edit/delete surface for transactions. Deliberately built against the RAW
 * `useGetTransactions` data (id/accountId/categoryId/payee/amount/date),
 * not the decorative `Transaction` view type used by TransactionTimeline —
 * that view type only carries display strings (account/category *names*,
 * formatted date/time), not the ids a PATCH/DELETE call needs, and
 * threading ids through the whole derived-view pipeline (use-financial-view
 * → month grouping → TransactionTimeline) risked destabilizing a working,
 * animation-heavy component for a Phase-1 stabilization pass. This modal
 * calls the same mutation hooks the timeline would use either way.
 */

import { useDeleteTransaction } from '@/src/features/transactions/api/use-delete-transaction'
import { useGetTransactions } from '@/src/features/transactions/api/use-get-transactions'
import { Modal } from '@/src/shared/components/modal'
import { Button } from '@/src/shared/ui/button'
import { formatCurrency } from '@/src/shared/lib/format'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  TransactionFormModal,
  type TransactionFormInitialValues,
} from './transaction-form-modal'

export function TransactionManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: transactions = [], isLoading } = useGetTransactions()
  const [editTarget, setEditTarget] = useState<TransactionFormInitialValues | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const deleteTransaction = useDeleteTransaction(confirmDeleteId ?? undefined)

  const confirmDelete = () => {
    if (!confirmDeleteId) return
    deleteTransaction.mutate(undefined, { onSuccess: () => setConfirmDeleteId(null) })
  }

  return (
    <>
      <Modal
        open={open && !editTarget}
        onClose={onClose}
        title="Recent transactions"
        description="Edit or delete transactions from the last 30 days."
      >
        <div className="flex flex-col gap-2">
          {isLoading && <p className="text-xs text-[var(--muted-foreground)]">Loading…</p>}

          {!isLoading && transactions.length === 0 && (
            <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">
              No transactions in this window yet.
            </p>
          )}

          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-2 rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{tx.payee}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {format(new Date(tx.date), 'd MMM yyyy')} · {tx.account}
                  {tx.category ? ` · ${tx.category}` : ''}
                </p>
              </div>
              <p
                className="shrink-0 text-sm font-semibold tabular-nums"
                style={{ color: tx.amount >= 0 ? 'var(--positive)' : 'var(--foreground)' }}
              >
                {formatCurrency(tx.amount, 'INR', { signed: true })}
              </p>
              <button
                type="button"
                aria-label={`Edit ${tx.payee}`}
                onClick={() =>
                  setEditTarget({
                    id: tx.id,
                    payee: tx.payee,
                    amount: tx.amount,
                    date: format(new Date(tx.date), 'yyyy-MM-dd'),
                    accountId: tx.accountId,
                    categoryId: tx.categoryId,
                    notes: tx.notes,
                  })
                }
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--foreground)]"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${tx.payee}`}
                onClick={() => setConfirmDeleteId(tx.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        {confirmDeleteId && (
          <Modal
            open
            onClose={() => setConfirmDeleteId(null)}
            title="Delete transaction?"
            description="This can't be undone."
          >
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteTransaction.isPending}>
                Delete
              </Button>
            </div>
          </Modal>
        )}
      </Modal>

      <TransactionFormModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        initialValues={editTarget ?? undefined}
      />
    </>
  )
}
