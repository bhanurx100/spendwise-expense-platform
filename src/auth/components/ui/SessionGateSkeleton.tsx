/**
 * src/auth/components/ui/SessionGateSkeleton.tsx
 *
 * Replaces the old ProtectedRoute spinner (and the previous pass's
 * LoadingState pulse) with a context-aware skeleton: it echoes the shape
 * of a real app shell (header bar + a couple of content blocks) rather
 * than a centered spinner with no relationship to what's about to appear.
 */
export function SessionGateSkeleton() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6 p-6" role="status" aria-live="polite">
      <span className="sr-only">Checking your session…</span>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full shimmer" />
        <div className="h-3.5 w-32 rounded-full shimmer" />
      </div>
      <div className="h-28 w-full rounded-[var(--radius,20px)] shimmer" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 rounded-[var(--radius-tile,14px)] shimmer" />
        <div className="h-16 rounded-[var(--radius-tile,14px)] shimmer" />
        <div className="h-16 rounded-[var(--radius-tile,14px)] shimmer" />
      </div>
      <style>{`
        .shimmer {
          background: linear-gradient(100deg, var(--surface-elevated) 30%, var(--hover) 50%, var(--surface-elevated) 70%);
          background-size: 200% 100%;
          animation: shimmer-sweep 1.4s ease-in-out infinite;
        }
        @keyframes shimmer-sweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { .shimmer { animation: none; opacity: 0.6; } }
      `}</style>
    </div>
  )
}
