"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import { SessionContextNotice } from "./ui/SessionContextNotice"
import { SuccessTransition } from "./ui/SuccessTransition"
import { MethodRow } from "./ui/MethodRow"
import { InlineGuidanceRow } from "./ui/InlineGuidance"
import { getInlineGuidance } from "../lib/auth-error-messages"

type PanelMode = "method" | "about" | "success"

interface AuthExperienceProps {
  callbackUrl: string
  /** Auth.js's `?error=` code, read once from the URL by the page — kept
   *  as a prop rather than re-reading searchParams here so this component
   *  has no framework-routing dependency baked in beyond what's passed. */
  initialErrorCode: string | null
}

/**
 * src/auth/components/AuthExperience.tsx
 *
 * THE authentication product, not a page. One mounted component, one
 * `mode` state machine, panels crossfade and the sheet's height morphs
 * (via Framer Motion's `layout` prop) between them — this is what makes
 * moving between "choose a method," "what happens if I'm new," and
 * "you're in" feel like states of one interface instead of navigating to
 * different pages, per this pass's core direction.
 *
 * Every call into next-auth is unchanged from the previous pass:
 * `signIn("google", { callbackUrl })` and `signIn("demo", { redirect:
 * false, callbackUrl })`. Only the surrounding UI/state orchestration is
 * new.
 *
 * WHY THERE'S NO "Sign Up," "Forgot Password," OR "Verification" MODE:
 * this project's Auth.js config (src/auth/config.ts) has exactly two
 * providers — Google OAuth and a demo Credentials provider. There is no
 * password, no email-link, no OTP anywhere in the schema or config, so
 * there is nothing real to give a mode here. The "about" mode below is
 * the honest version of "Sign Up" for this app: since Google account
 * creation is automatic on first sign-in, "Sign Up" isn't a different
 * flow, it's a one-sentence fact — so it gets a small explanatory panel
 * state instead of either a fake form or a silent redirect. See
 * AUTH_UI_REDESIGN.md §02 for the full reasoning, and §05 for exactly
 * what to add here if/when a real provider needing its own step exists.
 */
export function AuthExperience({ callbackUrl, initialErrorCode }: AuthExperienceProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [mode, setMode] = useState<PanelMode>("method")

  const [googleLoading, setGoogleLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const initialGuidance = getInlineGuidance(initialErrorCode)
  const [googleError, setGoogleError] = useState(initialGuidance?.target === "google" ? initialGuidance : null)
  const [demoError, setDemoError] = useState(initialGuidance?.target === "demo" ? initialGuidance : null)
  const [generalError, setGeneralError] = useState(initialGuidance?.target === "general" ? initialGuidance : null)

  async function handleGoogle() {
    setGoogleError(null)
    setGeneralError(null)
    setGoogleLoading(true)
    await signIn("google", { callbackUrl })
    // No further state update needed/possible — the browser navigates to
    // Google's own domain from here.
  }

  // inside the component:
  async function handleDemo() {
    setDemoError(null); setGeneralError(null); setDemoLoading(true)
    console.log("Attempting demo login")
    const result = await signIn("demo", { email: "demo@splitfin.app", password: "demo123", redirect: false, callbackUrl })
    console.log("Demo login result:", result)
    setDemoLoading(false)
    if (result?.error) {
      console.error("Demo login error:", result.error)
      setDemoError({ target: "demo", message: result.error, action: "Try again" })
      return
    }
    console.log("Demo login successful, navigating to:", callbackUrl)
    router.push(callbackUrl)
    router.refresh()
  }

  function attachGuidance(guidance: NonNullable<ReturnType<typeof getInlineGuidance>>) {
    if (guidance.target === "google") setGoogleError(guidance)
    else if (guidance.target === "demo") setDemoError(guidance)
    else setGeneralError(guidance)
  }

  return (
    <motion.div layout transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.4, 0, 0.2, 1] }} className="glass-hero overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === "method" && (
          <PanelContent key="method">
            <PanelHeader title="Welcome to SplitFin" subtitle="Continue with one of the options below." />
            {!initialErrorCode && <SessionContextNotice callbackUrl={callbackUrl} />}

            <div className="surface-group mx-4 sm:mx-6 overflow-hidden rounded-[var(--radius,20px)]">
              <MethodRow
                icon={<GoogleGlyph />}
                label="Continue with Google"
                loadingLabel="Connecting to Google"
                status={googleLoading ? "loading" : "idle"}
                onActivate={handleGoogle}
              />
              {googleError && (
                <InlineGuidanceRow message={googleError.message} action={googleError.action} onAction={handleGoogle} />
              )}
              <MethodRow
                icon={<SparkleGlyph />}
                label="Explore SplitFin"
                loadingLabel="Signing you in"
                hint="Demo"
                status={demoLoading ? "loading" : "idle"}
                onActivate={handleDemo}
              />
              {demoError && (
                <InlineGuidanceRow message={demoError.message} action={demoError.action} onAction={handleDemo} />
              )}
            </div>

            {generalError && (
              <div className="px-6 pt-1">
                <InlineGuidanceRow message={generalError.message} action={generalError.action} onAction={() => setGeneralError(null)} />
              </div>
            )}

            <button
              type="button"
              onClick={() => setMode("about")}
              className="mt-5 w-full pb-6 text-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              New to SplitFin?
            </button>
          </PanelContent>
        )}

        {mode === "about" && (
          <PanelContent key="about">
            <PanelHeader title="Getting started" />
            <div className="px-6 pb-6">
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                There&apos;s no separate account to create — continuing with Google the
                first time automatically sets up your SplitFin account. Prefer to
                look around first? Explore the demo, no account needed.
              </p>
              <button
                type="button"
                onClick={() => setMode("method")}
                className="mt-6 w-full rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Back to sign in
              </button>
            </div>
          </PanelContent>
        )}

        {mode === "success" && (
          <PanelContent key="success">
            <SuccessTransition callbackUrl={callbackUrl} onNavigate={(url) => router.push(url)} />
          </PanelContent>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PanelContent({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 pt-7 pb-5 text-center">
      <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59A8.5 8.5 0 0 0 9 0 9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

function SparkleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z" />
    </svg>
  )
}
