/**
 * src/auth/components/ui/RowSkeleton.tsx
 *
 * Replaces every spinner icon from the previous pass. Matches the exact
 * geometry of a MethodRow (icon-sized block + label-width bar) so nothing
 * shifts when loading resolves — a shimmer standing in for content, not a
 * generic "something is happening" spinner.
 */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" aria-hidden="true">
      <div className="size-5 rounded-md shimmer" />
      <div className="h-3.5 w-36 rounded-full shimmer" />
      <style>{`
        .shimmer {
          background: linear-gradient(
            100deg,
            var(--surface-elevated) 30%,
            var(--hover) 50%,
            var(--surface-elevated) 70%
          );
          background-size: 200% 100%;
          animation: shimmer-sweep 1.4s ease-in-out infinite;
        }
        @keyframes shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .shimmer { animation: none; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
