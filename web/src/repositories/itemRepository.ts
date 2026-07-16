import type { SupabaseClient } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { readUserCache, writeUserCache } from '../lib/cache'
import { planItemSchema, type PlanItem } from '../types/domain'

const itemListSchema = z.array(planItemSchema)
const cacheKey = 'items'

export const itemKeys = {
  all: ['items'] as const,
  list: (userId: string) => ['items', userId] as const,
}

export type ItemCreateInput = Pick<PlanItem, 'kind' | 'title'> & Partial<Pick<PlanItem,
  'parent_id' | 'description' | 'status' | 'sort_order' | 'is_important' | 'is_focus' |
  'schedule_granularity' | 'schedule_date' | 'schedule_start_time' | 'schedule_period_start' |
  'schedule_period_end' | 'duration_minutes'>>

export async function listItems(client: SupabaseClient, userId: string): Promise<PlanItem[]> {
  const { data, error } = await client.from('items').select('*').eq('user_id', userId).is('deleted_at', null).order('sort_order')
  if (error) throw error
  return itemListSchema.parse(data)
}

export async function listItemsOnlineFirst(
  client: SupabaseClient,
  userId: string,
  storage: Storage = localStorage,
): Promise<{ items: PlanItem[]; source: 'network' | 'cache' }> {
  try {
    const items = await listItems(client, userId)
    writeUserCache(storage, userId, cacheKey, items)
    return { items, source: 'network' }
  } catch (error) {
    const cached = readUserCache(storage, userId, cacheKey, itemListSchema)
    if (!cached) throw error
    return { items: cached, source: 'cache' }
  }
}

export async function createItem(client: SupabaseClient, userId: string, input: ItemCreateInput): Promise<PlanItem> {
  const { data, error } = await client.from('items').insert({ ...input, user_id: userId }).select('*').single()
  if (error) throw error
  return planItemSchema.parse(data)
}

export async function updateItem(
  client: SupabaseClient,
  userId: string,
  itemId: string,
  changes: Partial<Omit<PlanItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>>,
): Promise<PlanItem> {
  const { data, error } = await client.from('items').update(changes).eq('id', itemId).eq('user_id', userId).select('*').single()
  if (error) throw error
  return planItemSchema.parse(data)
}

export async function archiveItem(client: SupabaseClient, userId: string, itemId: string): Promise<void> {
  const { error } = await client.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', itemId).eq('user_id', userId)
  if (error) throw error
}

export function beginOptimisticItemUpdate(
  queryClient: QueryClient,
  userId: string,
  itemId: string,
  changes: Partial<PlanItem>,
) {
  const key = itemKeys.list(userId)
  const previous = queryClient.getQueryData<PlanItem[]>(key)
  queryClient.setQueryData<PlanItem[]>(key, (current = []) => current.map((item) => item.id === itemId ? { ...item, ...changes } : item))
  return () => queryClient.setQueryData(key, previous)
}
