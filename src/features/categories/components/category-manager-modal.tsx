'use client'

/**
 * features/categories/components/category-manager-modal.tsx
 *
 * Wires the existing category mutation hooks (useCreateCategory /
 * useEditCategory / useDeleteCategory) to a UI. No new mutation logic.
 * Same pattern as account-manager-modal.tsx.
 */

import { useCreateCategory } from '@/src/features/categories/api/use-create-category'
import { useDeleteCategory } from '@/src/features/categories/api/use-delete-category'
import { useEditCategory } from '@/src/features/categories/api/use-edit-category'
import { useGetCategories } from '@/src/features/categories/api/use-get-categories'
import { Modal } from '@/src/shared/components/modal'
import { Button } from '@/src/shared/ui/button'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

export function CategoryManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [], isLoading } = useGetCategories()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const createCategory = useCreateCategory()
  const editCategory = useEditCategory(editingId ?? undefined)
  const deleteCategory = useDeleteCategory(confirmDeleteId ?? undefined)

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const submitEdit = () => {
    if (!editingId || !editName.trim()) return
    editCategory.mutate({ name: editName.trim() }, { onSuccess: () => setEditingId(null) })
  }

  const submitCreate = () => {
    if (!newName.trim()) return
    createCategory.mutate({ name: newName.trim() }, { onSuccess: () => setNewName('') })
  }

  const confirmDelete = () => {
    if (!confirmDeleteId) return
    deleteCategory.mutate(undefined, { onSuccess: () => setConfirmDeleteId(null) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage categories" description="Add, rename, or remove categories.">
      <div className="flex flex-col gap-2">
        {isLoading && <p className="text-xs text-[var(--muted-foreground)]">Loading…</p>}

        {!isLoading && categories.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">No categories yet.</p>
        )}

        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-2 rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5"
          >
            {editingId === category.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm outline-none focus-visible:border-[var(--primary)]"
                />
                <Button size="sm" onClick={submitEdit} disabled={editCategory.isPending}>
                  Save
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel">
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)]">
                  {category.name}
                </p>
                <button
                  type="button"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => startEdit(category.id, category.name)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--foreground)]"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setConfirmDeleteId(category.id)}
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
            placeholder="New category name"
            className="flex-1 rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)]"
          />
          <Button onClick={submitCreate} disabled={createCategory.isPending || !newName.trim()}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {confirmDeleteId && (
        <Modal
          open
          onClose={() => setConfirmDeleteId(null)}
          title="Delete category?"
          description="Transactions using this category will become uncategorized. This can't be undone."
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteCategory.isPending}>
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
