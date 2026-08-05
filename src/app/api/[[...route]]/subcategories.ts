import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { insertSubcategorySchema } from '@/src/db/schema'
import { requireHonoUser } from '@/src/auth/server'
import { createSubcategory, getSubcategories } from '@/src/server/services/subcategory-service'

const app = new Hono()
  .get('/', zValidator('query', z.object({ categoryId: z.string().optional() })), async (ctx) => {
    const user = await requireHonoUser(ctx); if (!user) return ctx.json({ error: 'Unauthorized.' }, 401)
    return ctx.json({ data: await getSubcategories(user.id, ctx.req.valid('query').categoryId) })
  })
  .post('/', zValidator('json', insertSubcategorySchema), async (ctx) => {
    const user = await requireHonoUser(ctx); if (!user) return ctx.json({ error: 'Unauthorized.' }, 401)
    const data = await createSubcategory(user.id, ctx.req.valid('json'))
    return data ? ctx.json({ data }, 201) : ctx.json({ error: 'Category not found.' }, 404)
  })
export default app