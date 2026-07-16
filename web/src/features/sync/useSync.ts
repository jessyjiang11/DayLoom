import { useContext } from 'react'
import { SyncContext } from './syncContext'

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync 必须在 SyncProvider 内使用')
  return context
}
