'use client'

/**
 * features/accounts/components/account-manager-modal.tsx
 *
 * Wires the already-existing (and already-correct) account mutation hooks
 * — useCreateAccount / useEditAccount / useDeleteAccount — to an actual UI.
 * No new mutation logic: this component only calls the hooks in
 * `features/accounts/api/*`. See PHASE1_COMPLETION_REPORT.md.
 *
 * The create/edit API only accepts a `name` field (see
 * insertAccountSchema.pick({ name: true }) in accounts.ts), so that's the
 * only editable field here — matching what the backend actually supports
 * rather than inventing fields it would silently ignore.
 */

import { useCreateAccount } from '@/src/features/accounts/api/use-create-account'
import { useDeleteAccount } from '@/src/features/accounts/api/use-delete-account'
import { useEditAccount } from '@/src/features/accounts/api/use-edit-account'
import { useGetAccounts } from '@/src/features/accounts/api/use-get-accounts'
import { Modal } from '@/src/shared/components/modal'
import { Button } from '@/src/shared/ui/button'
import { formatCurrency } from '@/src/shared/lib/format'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

export function AccountManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: accounts = [], isLoading } = useGetAccounts()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const createAccount = useCreateAccount()
  const editAccount = useEditAccount(editingId ?? undefined)
  const deleteAccount = useDeleteAccount(confirmDeleteId ?? undefined)

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const submitEdit = () => {
    if (!editingId || !editName.trim()) return
    editAccount.mutate(
      { name: editName.trim() },
      { onSuccess: () => setEditingId(null) },
    )
  }

  const submitCreate = () => {
    if (!newName.trim()) return
    createAccount.mutate({ name: newName.trim() }, { onSuccess: () => setNewName('') })
  }

  const confirmDelete = () => {
    if (!confirmDeleteId) return
    deleteAccount.mutate(undefined, { onSuccess: () => setConfirmDeleteId(null) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage accounts" description="Add, rename, or remove accounts.">
      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-xs text-[var(--muted-foreground)]">Loading…</p>}

        {!isLoading && accounts.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">No accounts yet.</p>
        )}

        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-2 rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5"
          >
            {editingId === account.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm outline-none focus-visible:border-[var(--primary)]"
                />
                <Button size="sm" onClick={submitEdit} disabled={editAccount.isPending}>
                  Save
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel">
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{account.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatCurrency(account.type === 'credit-card' ? Math.abs(account.balance) : account.balance, 'INR')}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${account.name}`}
                  onClick={() => startEdit(account.id, account.name)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--foreground)]"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${account.name}`}
                  onClick={() => setConfirmDeleteId(account.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        <div className="mt-2 flex items-center gap-2 border-t border-[var(--divider)] pt-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
            placeholder="New account name"
            className="flex-1 rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)]"
          />
          <Button onClick={submitCreate} disabled={createAccount.isPending || !newName.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {confirmDeleteId && (
        <Modal
          open
          onClose={() => setConfirmDeleteId(null)}
          title="Delete account?"
          description="This also removes every transaction on this account. This can't be undone."
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteAccount.isPending}>
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
