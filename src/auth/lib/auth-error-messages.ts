/**
 * src/auth/lib/auth-error-messages.ts
 *
 * Auth.js redirects to `pages.error` (configured as "/sign-in" in
 * src/auth/config.ts) with `?error=<Code>` on any sign-in failure — that
 * mechanism is unchanged from the previous pass. What changed here: this
 * used to feed a red banner; per this pass's explicit "no red banners —
 * contextual inline guidance with recovery actions" direction, it now
 * returns a short line meant to sit directly beneath the row it concerns,
 * plus which row that is, so <AuthExperience> can attach it to the right
 * place instead of one generic alert for the whole panel.
 */

export type ErrorTarget = "google" | "demo" | "general"

export interface InlineGuidance {
  target: ErrorTarget
  /** One short line — sits under the row, not inside a bordered alert box. */
  message: string
  /** Label for the recovery action, e.g. "Try again". Every code gets one —
   *  there's no dead-end error state in this flow. */
  action: string
}

const GUIDANCE: Record<string, InlineGuidance> = {
  OAuthSignin: { target: "google", message: "Couldn't reach Google just now.", action: "Try again" },
  OAuthCallback: { target: "google", message: "Google sent back something we couldn't read.", action: "Try again" },
  OAuthCreateAccount: { target: "google", message: "Couldn't set up your account from Google.", action: "Try again" },
  OAuthAccountNotLinked: { target: "google", message: "This email is already registered a different way.", action: "Use that method instead" },
  Callback: { target: "general", message: "Something interrupted sign-in.", action: "Try again" },
  CredentialsSignin: { target: "demo", message: "The demo account isn't reachable right now.", action: "Try again" },
  AccessDenied: { target: "general", message: "This account doesn't have access yet.", action: "Try a different account" },
  Verification: { target: "general", message: "That link isn't valid anymore.", action: "Start again" },
  Configuration: { target: "general", message: "Sign-in is temporarily unavailable.", action: "Try again shortly" },
  Default: { target: "general", message: "That didn't go through.", action: "Try again" },
}

export function getInlineGuidance(code: string | null | undefined): InlineGuidance | null {
  if (!code) return null
  return GUIDANCE[code] ?? GUIDANCE.Default
}
