import { createId } from '@paralleldrive/cuid2'
import { and, eq } from 'drizzle-orm'
import { db } from '@/src/db/drizzle'
import { splitGroups, splitMembers } from '@/src/db/schema'

export const splitPayRepository = {
  listGroups: (userId: string) => db.select().from(splitGroups).where(eq(splitGroups.userId, userId)),
  listMembers: (userId: string) => db.select().from(splitMembers).where(eq(splitMembers.userId, userId)),
  async createGroup(userId: string, values: Omit<typeof splitGroups.$inferInsert, 'id' | 'userId' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'workspaceId'>) {
    const [row] = await db.insert(splitGroups).values({ ...values, id: createId(), userId, createdBy: userId, updatedBy: userId }).returning()
    return row
  },
  async createMember(userId: string, values: Omit<typeof splitMembers.$inferInsert, 'id' | 'userId' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>) {
    const [group] = await db.select({ id: splitGroups.id }).from(splitGroups).where(and(eq(splitGroups.id, values.groupId), eq(splitGroups.userId, userId)))
    if (!group) return null
    const [row] = await db.insert(splitMembers).values({ ...values, id: createId(), userId, createdBy: userId, updatedBy: userId }).returning()
    return row
  },
}
