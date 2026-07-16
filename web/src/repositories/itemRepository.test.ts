import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { PlanItem } from '../types/domain'
import { beginOptimisticItemUpdate, itemKeys } from './itemRepository'

const item = { id: 'item-1', title: '原任务' } as PlanItem

describe('item optimistic update', () => {
  it('can roll back a failed write', () => {
    const client = new QueryClient()
    client.setQueryData(itemKeys.list('user-1'), [item])
    const rollback = beginOptimisticItemUpdate(client, 'user-1', 'item-1', { title: '新标题' })
    expect(client.getQueryData<PlanItem[]>(itemKeys.list('user-1'))?.[0]?.title).toBe('新标题')
    rollback()
    expect(client.getQueryData<PlanItem[]>(itemKeys.list('user-1'))?.[0]?.title).toBe('原任务')
  })
})
