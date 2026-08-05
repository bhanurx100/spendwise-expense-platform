"use client"

interface InlineGuidanceRowProps {
  message: string
  action: string
  onAction: () => void
}

/**
 * src/auth/components/ui/InlineGuidance.tsx
 *
 * Explicit replacement for the previous pass's <AuthErrorBanner> (a
 * bordered, tinted-red alert box). Per this pass's direction — "do not
 * use red banners, use contextual inline guidance with recovery actions"
 * — this renders as a plain line in muted text with an inline action,
 * placed directly beneath the row it concerns by the caller, never as a
 * separate alert card competing with the panel's material.
 */
export function InlineGuidanceRow({ message, action, onAction }: InlineGuidanceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1" role="status">
      <p className="text-xs text-[var(--muted-foreground)]">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
      >
        {action}
      </button>
    </div>
  )
}
