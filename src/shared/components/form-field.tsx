'use client'

import { cn } from '@/src/lib/utils'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldClass =
  'w-full rounded-[var(--radius-tile)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]'

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-[var(--muted-foreground)]">
      {children}
    </label>
  )
}

export function TextField({
  label,
  id,
  error,
  className,
  ...props
}: { label: string; id: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={cn(fieldClass, className)} {...props} />
      {error && <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  )
}

export function TextAreaField({
  label,
  id,
  error,
  className,
  ...props
}: { label: string; id: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} className={cn(fieldClass, 'min-h-20 resize-none', className)} {...props} />
      {error && <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  )
}

export function SelectField({
  label,
  id,
  error,
  className,
  children,
  ...props
}: { label: string; id: string; error?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={cn(fieldClass, 'appearance-none')} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  )
}
