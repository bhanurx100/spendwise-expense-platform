/**
 * SplitFin Design Tokens
 * Single source of truth for visual constants. Implements DESIGN_SYSTEM.md v2.0.
 *
 * Corrects the prior version, which was "Dark-only theme. Glassmorphism. Neon
 * accents." with pink/purple/cyan glow shadows and heavy backdrop-blur on every
 * surface. This system is: dark + light (both required, §01 rule 15), blue +
 * green only (§06), glow-on-interaction only (§12), and blur reserved for
 * modals/sheets, never everyday cards (§11).
 */

// ─── Color Palette ──────────────────────────────────────────────────────────

export const colors = {
  bg: {
    dark: "#0A0A0C",
    light: "#F2F2F5", // warm off-white — never pure white, §24
  },
  surface: {
    dark: "#17171A",
    darkElevated: "#1E1E22",
    light: "#FFFFFF",
    lightElevated: "#FAFAFC",
  },

  /** The only 2 accent colors in the app. */
  accent: {
    blue: "#3B82F6",
    blueSubtleDark: "rgba(59, 130, 246, 0.12)",   // Focus Bubble / selected-state fill
    blueSubtleLight: "rgba(59, 130, 246, 0.08)",
    green: "#34D399", // dark-mode positive
    greenLight: "#16A34A", // light-mode positive (deeper for contrast on white)
  },

  /**
   * Destructive: irreversible actions (delete account, remove card) and the
   * "Over budget" status text exception (§18). NEVER a decorative accent,
   * NEVER an expense-amount color, NEVER a "you owe" color (§06).
   */
  destructive: "#EF4444",

  text: {
    primaryDark: "#F5F5F7",
    secondaryDark: "#9A9AA2",
    tertiaryDark: "#6B6B72",
    primaryLight: "#1C1C1E",
    secondaryLight: "#6E6E76",
    tertiaryLight: "#A0A0A8",
  },

  border: {
    hairlineDark: "rgba(255, 255, 255, 0.08)",
    hairlineLight: "rgba(0, 0, 0, 0.08)",
    dividerDark: "rgba(255, 255, 255, 0.06)", // thinner — rows inside one card
    dividerLight: "rgba(0, 0, 0, 0.06)",
    strongDark: "rgba(255, 255, 255, 0.14)",
    strongLight: "rgba(0, 0, 0, 0.14)",
  },
} as const

// ─── Typography ──────────────────────────────────────────────────────────────
// Matches DESIGN_SYSTEM.md §07 exactly — do not add sizes outside this scale.

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
  },
  scale: {
    display:     { size: "34px", weight: 700, lineHeight: "40px" }, // Net Worth hero only
    heading:     { size: "28px", weight: 700, lineHeight: "34px" }, // page titles
    title:       { size: "20px", weight: 600, lineHeight: "26px" }, // section headers
    body:        { size: "16px", weight: 400, lineHeight: "22px" },
    bodyMedium:  { size: "16px", weight: 600, lineHeight: "22px" },
    caption:     { size: "13px", weight: 400, lineHeight: "18px" }, // metadata, timestamps
    label:       { size: "12px", weight: 500, lineHeight: "16px" }, // "Quick actions"
    amount:      { size: "18px", weight: 600, lineHeight: "24px", tabularNums: true },
  },
} as const

// ─── Spacing ─────────────────────────────────────────────────────────────────
// 4px base grid — DESIGN_SYSTEM.md §08

export const spacing = {
  1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px",
  6: "24px", 7: "32px", 8: "40px", 9: "48px", 10: "64px",
} as const

// ─── Border Radius ────────────────────────────────────────────────────────────
// DESIGN_SYSTEM.md §09 — 4 values only. No 6/10/18/32 in between.

export const radius = {
  tile: "14px",  // icon tiles
  card: "20px",  // standard cards, list items
  cardLg: "24px", // hero cards, physical card carousel
  pill: "9999px", // chips, segments, buttons
} as const

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Neutral only at rest. --glow-press is the ONLY colored shadow in the app,
// and it only ever applies for the duration of a press. No glowPink/glowPurple/
// glowCyan/innerPink/innerPurple — those encoded a per-brand-hue glow system
// that DESIGN_SYSTEM.md §26 removes entirely.

export const shadows = {
  cardDark: "0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
  cardLight: "0 4px 16px rgba(15,23,42,0.06)",
  tileDark: "0 2px 8px rgba(0,0,0,0.35)",
  tileLight: "0 2px 8px rgba(15,23,42,0.05)",

  /** The ONE interaction glow in the entire app. Applies on :active / whileTap only. */
  glowPress: "0 0 0 3px rgba(59, 130, 246, 0.18)",
} as const

// ─── Motion Tokens ────────────────────────────────────────────────────────────
// DESIGN_SYSTEM.md §12

export const motion = {
  duration: {
    fast: 150,     // press states, chip toggle
    standard: 250, // page-level transitions, card expand
    slow: 400,     // hero reveals, first-load sequences
  },

  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
  },

  /**
   * Focus Bubble — the tvOS-style morphing selection indicator, §12.1.
   * Used exclusively by GlassSegment / GlassNavIndicator via Framer Motion's
   * `layoutId`. Do not use a bouncier spring than this anywhere else in the
   * app — this is the one place overshoot is intentional.
   */
  focusBubble: { type: "spring" as const, stiffness: 300, damping: 30 },

  /** Standard card entrance — first mount only, never on re-render. */
  cardEntrance: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
  },

  /** Standard press feedback for any interactive surface. */
  press: {
    scale: 0.98,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  },

  /** Sheet / modal open — the only surfaces allowed real backdrop-blur, §11. */
  sheet: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 320, damping: 34 } },
    exit: { y: "100%", opacity: 0 },
  },

  /** Chart entrance — staggered, first load only. */
  chartBar: {
    stagger: 20,   // ms between bars
    total: 400,    // ms total sequence
  },

  /** Chart tooltip follow — spring-eases to the touch point rather than snapping. */
  tooltip: {
    transition: { duration: 0.15 },
    followSpring: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
} as const

// ─── Glass Presets ────────────────────────────────────────────────────────────
// Corrects the prior version's heavy blur-everywhere approach. Per §10/§11:
// everyday cards are OPAQUE with a sheen, not blurred — blur is reserved
// strictly for surfaces that sit in front of other content (modals, sheets).

export const glass = {
  /** Default card — opaque, hairline border, neutral shadow. No blur. */
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-card)",
  },
  /** Icon tile — opaque, hairline border, small neutral shadow. No blur. */
  tile: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-tile)",
  },
  /**
   * Modal / bottom sheet — the ONLY surfaces permitted real backdrop-blur,
   * and only ONE blur layer may be active on screen at a time (§11/§23).
   */
  sheet: {
    background: "var(--popover)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid var(--border-strong)",
  },
  /** Input / form element — opaque, no blur. */
  input: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
  },
  /** Bottom navigation — opaque with a soft top shadow, no blur (it never sits over dynamic scrolling content that needs blur separation on this app's layout). */
  nav: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
  },
} as const

// ─── Z-Index Scale ────────────────────────────────────────────────────────────

export const zIndex = {
  below: -1, base: 0, raised: 10, dropdown: 20,
  sticky: 30, overlay: 40, modal: 50, toast: 60, tooltip: 70,
} as const

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const breakpoints = {
  sm: "375px",  // small phones, §22
  md: "430px",  // regular phones
  lg: "768px",  // tablets (future)
  xl: "1024px", // desktop (future)
} as const

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  maxWidth: "430px",
  safeAreaBottom: "env(safe-area-inset-bottom, 20px)",
  navHeight: "76px",
  headerHeight: "60px",
  pagePaddingX: "20px",
  pagePaddingXSmall: "16px", // <375px, §22
  pagePaddingTop: "16px",
  /** Scroll containers must always clear the fixed bottom nav — §22/§23. */
  scrollBottomPadding: "calc(76px + env(safe-area-inset-bottom, 0px) + 32px)",
} as const