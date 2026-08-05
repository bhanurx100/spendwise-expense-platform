import { createId } from '@paralleldrive/cuid2'
import { and, eq } from 'drizzle-orm'
import { db } from '@/src/db/drizzle'
import { categories, subcategories } from '@/src/db/schema'

export const subcategoryRepository = {
  list: (userId: string, categoryId?: string) => db.select().from(subcategories).where(and(eq(subcategories.userId, userId), categoryId ? eq(subcategories.categoryId, categoryId) : undefined)),
  async create(userId: string, values: { categoryId: string; name: string }) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, values.categoryId), eq(categories.userId, userId)))
    if (!category) return null
    const [row] = await db.insert(subcategories).values({ id: createId(), userId, ...values }).returning()
    return row
  },
}
