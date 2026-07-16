import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import { planItemSchema, type PlanItem } from '../types/domain'
import { itemKeys } from './itemRepository'
import { periodNoteKeys, reviewKeys } from './reviewRepository'

type Row = Record<string, unknown>
type RealtimeState = 'connected' | 'reconnecting' | 'error'

export function mergeRemoteItem(current: PlanItem[] | undefined, row: Row): PlanItem[] {
  const parsed = planItemSchema.safeParse(row)
  if (!parsed.success) return current ?? []
  const incoming = parsed.data
  const existing = current?.find((item) => item.id === incoming.id)

  if (incoming.deleted_at) return (current ?? []).filter((item) => item.id !== incoming.id)
  if (existing && (
    existing.version > incoming.version ||
    (existing.version === incoming.version && existing.updated_at >= incoming.updated_at)
  )) return current ?? []

  if (!existing) return [...(current ?? []), incoming].sort((a, b) => a.sort_order - b.sort_order)
  return (current ?? []).map((item) => item.id === incoming.id ? incoming : item)
}

export function subscribeToWorkspace(options: {
  client: SupabaseClient
  userId: string
  queryClient: QueryClient
  onState: (state: RealtimeState) => void
}): () => void {
  const { client, userId, queryClient, onState } = options
  let reconnected = false
  const channel: RealtimeChannel = client.channel(`workspace:${userId}`)
  const filter = `user_id=eq.${userId}`

  const handleItem = (payload: RealtimePostgresChangesPayload<Row>) => {
    queryClient.setQueryData<PlanItem[]>(itemKeys.list(userId), (current) => mergeRemoteItem(current, payload.new))
  }
  channel.on<Row>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter }, handleItem)
  channel.on<Row>('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter }, handleItem)

  const invalidate = (queryKey: readonly string[]) => () => {
    void queryClient.invalidateQueries({ queryKey })
  }

  const subscribeToWrites = (table: string, handler: () => void) => {
    channel.on<Row>('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, handler)
    channel.on<Row>('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter }, handler)
  }
  subscribeToWrites('period_notes', invalidate(periodNoteKeys.list(userId)))
  subscribeToWrites('reviews', invalidate(reviewKeys.list(userId)))
  subscribeToWrites('tags', invalidate(['tags', userId]))
  subscribeToWrites('item_tags', invalidate(['item-tags', userId]))

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      onState('connected')
      if (reconnected) {
        void queryClient.invalidateQueries({ queryKey: itemKeys.list(userId) })
        void queryClient.invalidateQueries({ queryKey: reviewKeys.list(userId) })
        void queryClient.invalidateQueries({ queryKey: periodNoteKeys.list(userId) })
        reconnected = false
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      reconnected = true
      onState('reconnecting')
    } else if (status === 'CLOSED') {
      reconnected = true
      onState('error')
    }
  })

  return () => { void client.removeChannel(channel) }
}

export type WorkspaceChange = RealtimePostgresChangesPayload<Row>
