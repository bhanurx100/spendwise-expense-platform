import { handlers } from "@/src/auth/server";

/**
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * NOTE ON FILENAME: this file must live at the literal path
 *   src/app/api/auth/[...nextauth]/route.ts
 * (Next.js dynamic-route brackets). It's saved here with URL-encoded
 * brackets (%5B...%5D) only because this delivery format can't contain a
 * literal "[" in a path — rename the folder to "[...nextauth]" when you
 * copy it into your project.
 */
export const { GET, POST } = handlers;
