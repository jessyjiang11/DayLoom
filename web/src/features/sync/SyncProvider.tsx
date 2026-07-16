import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { itemKeys } from '../../repositories/itemRepository'
import { periodNoteKeys, reviewKeys } from '../../repositories/reviewRepository'
import { useAuth } from '../auth/useAuth'
import { SyncContext, type SyncState } from './syncContext'

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [state, setState] = useState<SyncState>(() => navigator.onLine ? 'saved' : 'offline')

  useEffect(() => {
    const handleOffline = () => setState('offline')
    const handleOnline = () => {
      setState('reconnecting')
      if (user) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) }),
          queryClient.invalidateQueries({ queryKey: reviewKeys.list(user.id) }),
          queryClient.invalidateQueries({ queryKey: periodNoteKeys.list(user.id) }),
        ]).finally(() => setState('saved'))
      } else {
        setState('saved')
      }
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [queryClient, user])

  const value = useMemo(() => ({
    state,
    readOnly: state === 'offline',
    reportNetworkError: () => setState(navigator.onLine ? 'error' : 'offline'),
    reportNetworkSuccess: () => setState('saved'),
  }), [state])

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
