import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { insertSplitGroupSchema, insertSplitMemberSchema } from '@/src/db/schema'
import { requireHonoUser } from '@/src/auth/server'
import { createSplitGroup, createSplitMember, getSplitPay } from '@/src/server/services/splitpay-service'

const app = new Hono()
  .get('/', async (ctx) => {
    const user = await requireHonoUser(ctx); if (!user) return ctx.json({ error: 'Unauthorized.' }, 401)
    const [groups, members] = await getSplitPay(user.id)
    return ctx.json({ data: { groups, members } })
  })
  .post('/groups', zValidator('json', insertSplitGroupSchema), async (ctx) => {
    const user = await requireHonoUser(ctx); if (!user) return ctx.json({ error: 'Unauthorized.' }, 401)
    return ctx.json({ data: await createSplitGroup(user.id, ctx.req.valid('json')) }, 201)
  })
  .post('/members', zValidator('json', insertSplitMemberSchema), async (ctx) => {
    const user = await requireHonoUser(ctx); if (!user) return ctx.json({ error: 'Unauthorized.' }, 401)
    const data = await createSplitMember(user.id, ctx.req.valid('json'))
    return data ? ctx.json({ data }, 201) : ctx.json({ error: 'Group not found.' }, 404)
  })

export default app