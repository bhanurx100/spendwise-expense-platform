import { splitPayRepository } from '@/src/server/repositories/splitpay-repository'

export const getSplitPay = async (userId: string) => Promise.all([splitPayRepository.listGroups(userId), splitPayRepository.listMembers(userId)])
export const createSplitGroup = splitPayRepository.createGroup
export const createSplitMember = splitPayRepository.createMember
