/**
 * app/api/[[...route]]/summary.ts
 *
 * Route handler only — auth, input validation, and ctx.json().
 * All aggregation logic lives in summaryService / summaryRepository.
 *
 * PHASE 1 FIX: this route previously ran raw Drizzle queries inline
 * (join/group-by/aggregate SQL built directly in the handler), duplicating
 * — with no meaningful differences — the already-existing, already-
 * optimized summary-service.ts + summary-repository.ts, which were sitting
 * completely unused. That's the "Services own all business logic,
 * Repositories own only persistence, routes stay thin" rule (see
 * accounts.ts / transactions.ts) violated in exactly the way Phase 1 is
 * meant to fix. Response shape is unchanged.
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { requireHonoUser } from "@/src/auth/server";
import { summaryService } from "@/src/server/services/summary-service";

const app = new Hono().get(
  "/",
  zValidator(
    "query",
    z.object({
      from:      z.string().optional(),
      to:        z.string().optional(),
      accountId: z.string().optional(),
    })
  ),
  async (ctx) => {
    const user = await requireHonoUser(ctx);
    if (!user) return ctx.json({ error: "Unauthorized." }, 401);

    const { from, to, accountId } = ctx.req.valid("query");

    const data = await summaryService.getSummaryForUser({
      userId: user.id,
      from,
      to,
      accountId,
    });

    return ctx.json({ data });
  }
);

export default app;
