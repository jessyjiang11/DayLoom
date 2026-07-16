import { createContext } from 'react'

export type SyncState = 'saved' | 'reconnecting' | 'offline' | 'error'
export type SyncContextValue = {
  state: SyncState
  readOnly: boolean
  reportNetworkError: () => void
  reportNetworkSuccess: () => void
}

export const SyncContext = createContext<SyncContextValue | null>(null)
