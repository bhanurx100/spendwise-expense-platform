import Image from "next/image"

/**
 * src/auth/components/ui/AuthWorkspace.tsx
 *
 * Replaces the previous pass's AuthLayout — that was still, structurally,
 * a centered-card template (logo panel + centered column). Per this
 * pass's explicit "not a centered login card, a premium authentication
 * workspace" direction:
 *
 *   - Generous, breakpoint-scaled padding (never edge-to-edge, at any size)
 *   - An informational zone that carries real weight on wide screens
 *     instead of being a decorative afterthought panel
 *   - The one sheet (<AuthExperience>, passed as children) sits in a
 *     `.glow-zone` — this experience's single sanctioned ambient-glow
 *     surface, same rule your material system already applies to hero
 *     elements elsewhere in the app
 *   - Caps at a readable max-width on ultra-wide rather than stretching
 */
export function AuthWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[var(--background)] flex flex-col lg:flex-row">
      <div className="flex flex-col justify-center gap-6 px-6 py-12 sm:px-10 lg:w-[44%] lg:px-16 lg:py-0 2xl:px-24">
        <Image src="/logo.svg" alt="SplitFin" height={40} width={40} priority />
        <div className="max-w-md">
          <h1 className="text-[28px] sm:text-[34px] font-semibold leading-[1.15] tracking-tight text-[var(--foreground)]">
            All your money,
            <br />
            all in one place.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
            Calm, precise, and built to make managing money feel effortless —
            one continuous experience, not a form to fill out.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10 lg:px-16 2xl:px-24">
        <div className="glow-zone w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  )
}
