'use client'

import { useQuery } from '@tanstack/react-query'
import { client } from '@/src/lib/hono'
import { convertAmountFromMilliunits } from '@/src/lib/utils'
import type { SplitGroup, SplitMember } from '@/src/types/transaction'

async function getSplitPay(): Promise<{ groups: SplitGroup[]; members: SplitMember[] }> {
  const response = await client.api.splitpay.$get()
  if (!response.ok) throw new Error('Failed to fetch SplitPay data.')
  const { data } = await response.json()
  return {
    groups: data.groups.map((group) => ({
      id: group.id, name: group.name, emojiIcon: group.emojiIcon, coverColor: '', membersSettled: 0, membersTotal: 0,
      memberAvatars: [], extraMembers: 0, status: group.status as SplitGroup['status'],
      amount: convertAmountFromMilliunits(group.amount), totalAmount: convertAmountFromMilliunits(group.totalAmount), currency: group.currency as SplitGroup['currency'],
    })),
    members: data.members.map((member) => ({
      id: member.id, name: member.name, avatar: member.avatar, netBalance: convertAmountFromMilliunits(member.netBalance),
      direction: member.direction as SplitMember['direction'],
    })),
  }
}

export const useSplitPay = () => useQuery({ queryKey: ['splitpay'], queryFn: getSplitPay, staleTime: 60_000 })
