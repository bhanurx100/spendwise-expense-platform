/**
 * app/api/[[...route]]/categories.ts
 *
 * Route handlers only — auth, input validation, ctx.json().
 * All DB access delegated to the service layer.
 * All response shapes preserved exactly.
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { insertCategorySchema } from "@/src/db/schema";
import { requireHonoUser } from "@/src/auth/server";
import {
  getCategories,
  getCategory,
  createCategory,
  editCategory,
  removeCategory,
  removeManyCategories,
} from "@/src/server/services/category-service";

const app = new Hono()

  // ── GET / ──────────────────────────────────────────────────────────────────
  .get("/", async (ctx) => {
    const user = await requireHonoUser(ctx);
    if (!user) return ctx.json({ error: "Unauthorized." }, 401);

    const data = await getCategories(user.id);
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

      const data = await getCategory(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  )

  // ── POST / ─────────────────────────────────────────────────────────────────
  .post(
    "/",
    zValidator("json", insertCategorySchema.pick({ name: true })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await createCategory(user.id, values);
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

      const data = await removeManyCategories(values.ids, user.id);
      return ctx.json({ data });
    }
  )

  // ── PATCH /:id ─────────────────────────────────────────────────────────────
  .patch(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertCategorySchema.pick({ name: true })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");
      const values = ctx.req.valid("json");

      if (!id) return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await editCategory(id, user.id, values);
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

      const data = await removeCategory(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  );

export default app;