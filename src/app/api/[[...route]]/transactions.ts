/**
 * app/api/[[...route]]/transactions.ts
 *
 * Route handlers only — auth, input validation, and ctx.json().
 * All DB access is delegated to the service layer.
 *
 * Response shapes are preserved exactly to avoid breaking clients.
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { insertTransactionSchema } from "@/src/db/schema";
import { requireHonoUser } from "@/src/auth/server";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  createManyTransactions,
  editTransaction,
  removeTransaction,
  removeManyTransactions,
} from "@/src/server/services/transaction-service";
import { AccountOwnershipError } from "@/src/server/repositories/transaction-repository";

// Shared handler for the ownership-guard error so both POST routes below
// return a consistent 403 instead of a raw 500 when a client references an
// accountId it doesn't own.
function isOwnershipError(err: unknown): err is AccountOwnershipError {
  return err instanceof AccountOwnershipError;
}

const app = new Hono()

  // ── GET / ─────────────────────────────────────────────────────────────────
  .get(
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

      const data = await getTransactions(user.id, { from, to, accountId });
      return ctx.json({ data });
    }
  )

  // ── GET /:id ──────────────────────────────────────────────────────────────
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");

      if (!id)   return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await getTransaction(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  )

  // ── POST / ────────────────────────────────────────────────────────────────
  .post(
    "/",
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (ctx) => {
      const user   = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      try {
        const data = await createTransaction(user.id, values);
        return ctx.json({ data });
      } catch (err) {
        if (isOwnershipError(err)) {
          return ctx.json({ error: "Forbidden: account does not belong to you." }, 403);
        }
        throw err;
      }
    }
  )

  // ── POST /bulk-create ─────────────────────────────────────────────────────
  .post(
    "/bulk-create",
    zValidator("json", z.array(insertTransactionSchema.omit({ id: true }))),
    async (ctx) => {
      const user   = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      try {
        const data = await createManyTransactions(user.id, values);
        return ctx.json({ data });
      } catch (err) {
        if (isOwnershipError(err)) {
          return ctx.json({ error: "Forbidden: one or more accounts do not belong to you." }, 403);
        }
        throw err;
      }
    }
  )

  // ── POST /bulk-delete ─────────────────────────────────────────────────────
  .post(
    "/bulk-delete",
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (ctx) => {
      const user   = await requireHonoUser(ctx);
      const values = ctx.req.valid("json");

      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await removeManyTransactions(values.ids, user.id);
      return ctx.json({ data });
    }
  )

  // ── PATCH /:id ────────────────────────────────────────────────────────────
  .patch(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (ctx) => {
      const user   = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");
      const values = ctx.req.valid("json");

      if (!id)   return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await editTransaction(id, user.id, values);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  )

  // ── DELETE /:id ───────────────────────────────────────────────────────────
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string().optional() })),
    async (ctx) => {
      const user = await requireHonoUser(ctx);
      const { id } = ctx.req.valid("param");

      if (!id)   return ctx.json({ error: "Missing id." }, 400);
      if (!user) return ctx.json({ error: "Unauthorized." }, 401);

      const data = await removeTransaction(id, user.id);
      if (!data) return ctx.json({ error: "Not found." }, 404);

      return ctx.json({ data });
    }
  );

export default app;