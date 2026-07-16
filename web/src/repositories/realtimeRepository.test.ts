import type { SupabaseClient } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { PlanItem } from '../types/domain'
import { itemKeys } from './itemRepository'
import { mergeRemoteItem, subscribeToWorkspace } from './realtimeRepository'

const base = {
  id: '1f6e4e74-dd04-4c6f-b932-b38dfeb8f9ba',
  user_id: '0f3b47e4-7748-4291-88d1-b29b53c98162',
  parent_id: null,
  kind: 'task', title: '旧标题', description: '', status: 'todo', sort_order: 1,
  is_important: false, is_focus: false, schedule_granularity: null, schedule_date: null,
  schedule_start_time: null, schedule_period_start: null, schedule_period_end: null,
  duration_minutes: null, version: 1, deleted_at: null,
  created_at: '2026-07-16T01:00:00.000Z', updated_at: '2026-07-16T01:00:00.000Z',
} as PlanItem

describe('realtime workspace', () => {
  it('merges newer changes and removes soft-deleted items', () => {
    const newer = { ...base, title: '新标题', version: 2, updated_at: '2026-07-16T02:00:00.000Z' }
    expect(mergeRemoteItem([base], newer)[0]?.title).toBe('新标题')
    expect(mergeRemoteItem([newer], base)[0]?.title).toBe('新标题')
    expect(mergeRemoteItem([newer], { ...newer, version: 3, deleted_at: '2026-07-16T03:00:00.000Z' })).toEqual([])
  })

  it('subscribes, refreshes after reconnect, and cleans up', () => {
    const handlers: Array<(payload: never) => void> = []
    let statusHandler: ((status: 'SUBSCRIBED' | 'CHANNEL_ERROR') => void) | undefined
    const channel = {
      on: vi.fn((_type, _filter, handler) => { handlers.push(handler); return channel }),
      subscribe: vi.fn((handler) => { statusHandler = handler; return channel }),
    }
    const removeChannel = vi.fn().mockResolvedValue('ok')
    const client = { channel: vi.fn(() => channel), removeChannel } as unknown as SupabaseClient
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const onState = vi.fn()
    const cleanup = subscribeToWorkspace({ client, userId: base.user_id, queryClient, onState })

    expect(channel.on).toHaveBeenCalledTimes(10)
    statusHandler?.('CHANNEL_ERROR')
    statusHandler?.('SUBSCRIBED')
    expect(onState).toHaveBeenLastCalledWith('connected')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: itemKeys.list(base.user_id) })
    cleanup()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })
})
