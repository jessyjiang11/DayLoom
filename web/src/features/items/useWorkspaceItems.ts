import { useQuery } from '@tanstack/react-query'
import { itemKeys, listItemsOnlineFirst } from '../../repositories/itemRepository'
import { useAuth } from '../auth/useAuth'
import { useSync } from '../sync/useSync'

export function useWorkspaceItems() {
  const { client, user } = useAuth()
  const sync = useSync()
  const query = useQuery({
    queryKey: itemKeys.list(user?.id ?? ''),
    enabled: Boolean(client && user),
    queryFn: async () => {
      const result = await listItemsOnlineFirst(client!, user!.id)
      if (result.source === 'cache') sync.reportNetworkError(); else sync.reportNetworkSuccess()
      return result.items
    },
  })
  return { ...query, client, user, sync, items: query.data ?? [] }
}
