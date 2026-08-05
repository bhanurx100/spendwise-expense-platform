/**
 * app/api/[[...route]]/accounts.ts
 *
 * MIGRATED FROM CLERK. The only change in every handler:
 *   - clerkMiddleware()                 → removed
 *   - const auth = getAuth(ctx)          → const user = await requireHonoUser(ctx)
 *   - if (!auth?.userId)                 → if (!user)
 *   - auth.userId                        → user.id
 *
 * Apply this exact same three-line swap to categories.ts, summary.ts, and
 * transactions.ts — response shapes are untouched.
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { insertAccountSchema } from "@/src/db/schema";
import { requireHonoUser } from "@/src/auth/server";
import {
  getAccounts,
  getAccount,
  createAccount,
  editAccount,
  removeAccount,
  removeManyAccounts,
} from "@/src/server/services/account-service";

const app = new Hono()

  // ── GET / ──────────────────────────────────────────────────────────────────
  .get("/", async (ctx) => {
    const user = await requireHonoUser(ctx);
    if (!user) return ctx.json({ error: "Unauthorized." }, 401);

    const data = await getAccounts(user.id);
    return ctx.json({ data });
  })

  // ── GET /:id ───────────────────────────────────────────────────────────────
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");

      if (!id) return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await getAccount(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  )

  // ── POST / ─────────────────────────────────────────────────────────────────
  .post(
    "/",
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await createAccount(user.id, values);
      return ctx.json({ data });
    }
  )

  // ── POST /bulk-delete ──────────────────────────────────────────────────────
  .post(
    "/bulk-delete",
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await removeManyAccounts(values.ids, user.id);
      return ctx.json({ data });
    }
  )

  // ── PATCH /:id ─────────────────────────────────────────────────────────────
  .patch(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");
      const values = ctx.req.valid("json");

      if (!id) return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await editAccount(id, user.id, values);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  )

  // ── DELETE /:id ────────────────────────────────────────────────────────────
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");

      if (!id) return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await removeAccount(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  );

export default app;
