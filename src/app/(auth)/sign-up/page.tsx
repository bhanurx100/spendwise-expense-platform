import { redirect } from "next/navigation";

/**
 * src/app/(auth)/sign-up/page.tsx
 *
 * Google OAuth (and every other provider on the roadmap — Apple, Microsoft,
 * GitHub, magic link) has no distinct "create an account" step: the first
 * successful sign-in creates the user row via the Drizzle adapter
 * automatically. The old Clerk <SignUp> page is removed; this route just
 * redirects so any existing links/bookmarks to /sign-up still work.
 */
export default function SignUpPage() {
  redirect("/sign-in");
}
