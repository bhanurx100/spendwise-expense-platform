'use client'

/**
 * features/transactions/components/transaction-form-modal.tsx
 *
 * Wires the existing transaction mutation hooks (useCreateTransaction /
 * useEditTransaction) to a real form. No new mutation logic — this only
 * calls the hooks in `features/transactions/api/*`, which already contain
 * the ownership-checked create/edit calls and cache invalidation.
 *
 * `income` is stored as a positive amount, `expense` as negative — matching
 * the sign convention every other reader in the codebase already assumes
 * (see summary-repository.ts's `amount >= 0` checks).
 */

import { useCreateTransaction } from '@/src/features/transactions/api/use-create-transaction'
import { useEditTransaction } from '@/src/features/transactions/api/use-edit-transaction'
import { useGetAccounts } from '@/src/features/accounts/api/use-get-accounts'
import { useGetCategories } from '@/src/features/categories/api/use-get-categories'
import { Modal } from '@/src/shared/components/modal'
import { SelectField, TextAreaField, TextField } from '@/src/shared/components/form-field'
import { Button } from '@/src/shared/ui/button'
import { convertAmountToMilliunits } from '@/src/lib/utils'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

export type TransactionFormInitialValues = {
  id: string
  payee: string
  amount: number // decimal, signed (positive = income, negative = expense)
  date: string // yyyy-MM-dd
  accountId: string
  categoryId: string | null
  notes: string | null
}

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  /** Present for edit mode; absent for create mode. */
  initialValues?: TransactionFormInitialValues
}

export function TransactionFormModal({ open, onClose, initialValues }: TransactionFormModalProps) {
  const isEdit = Boolean(initialValues)
  const { data: accounts = [] } = useGetAccounts()
  const { data: categories = [] } = useGetCategories()

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [payee, setPayee] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setType(initialValues.amount < 0 ? 'expense' : 'income')
      setPayee(initialValues.payee)
      setAmount(String(Math.abs(initialValues.amount)))
      setDate(initialValues.date)
      setAccountId(initialValues.accountId)
      setCategoryId(initialValues.categoryId ?? '')
      setNotes(initialValues.notes ?? '')
    } else {
      setType('expense')
      setPayee('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setAccountId(accounts[0]?.id ?? '')
      setCategoryId('')
      setNotes('')
    }
  }, [open, initialValues, accounts])

  const createTransaction = useCreateTransaction()
  const editTransaction = useEditTransaction(initialValues?.id)

  const isPending = createTransaction.isPending || editTransaction.isPending
  const canSubmit = payee.trim().length > 0 && amount.trim().length > 0 && accountId.length > 0

  const submit = () => {
    if (!canSubmit) return
    const numericAmount = Number(amount)
    if (Number.isNaN(numericAmount)) return

    const signedDecimal = type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount)

    const payload = {
      payee: payee.trim(),
      amount: convertAmountToMilliunits(signedDecimal),
      date,
      accountId,
      categoryId: categoryId || null,
      notes: notes.trim() || null,
    } as const

    if (isEdit && initialValues) {
      editTransaction.mutate(payload as never, { onSuccess: onClose })
    } else {
      createTransaction.mutate(payload as never, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit transaction' : 'Add transaction'}
      description={isEdit ? 'Update the details below.' : 'Record income, an expense, or a transfer.'}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-tile)] bg-[var(--surface-elevated)] p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-[calc(var(--radius-tile)-4px)] py-2 text-sm font-semibold capitalize transition-colors ${
                type === t
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <TextField
          id="tx-payee"
          label="Payee"
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder="e.g. Swiggy"
        />

        <TextField
          id="tx-amount"
          label="Amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />

        <TextField
          id="tx-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <SelectField
          id="tx-account"
          label="Account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="" disabled>
            Select an account
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="tx-category"
          label="Category (optional)"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>

        <TextAreaField
          id="tx-notes"
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note…"
        />

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || isPending}>
            {isEdit ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
