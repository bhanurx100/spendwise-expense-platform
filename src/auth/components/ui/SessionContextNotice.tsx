/**
 * src/auth/components/ui/SessionContextNotice.tsx
 *
 * middleware.ts already appends `?callbackUrl=<path>` when it redirects an
 * unauthenticated request away from a protected route (see middleware.ts's
 * `signInUrl.searchParams.set("callbackUrl", pathname)`). This component
 * only reads that existing param to say *why* the user landed here — no
 * new redirect logic, no new query param, just surfacing what's already
 * there instead of silently swallowing the context.
 */
export function SessionContextNotice({ callbackUrl }: { callbackUrl: string }) {
  if (callbackUrl === "/" || !callbackUrl) return null

  const label = humanizePath(callbackUrl)

  return (
    <p className="mb-5 text-center text-xs text-[var(--muted-foreground)]">
      Sign in to continue to <span className="font-medium text-[var(--foreground)]">{label}</span>.
    </p>
  )
}

function humanizePath(path: string): string {
  const segment = path.split("/").filter(Boolean)[0] ?? "your dashboard"
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}
