import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, error } = useAuth()
  const location = useLocation()

  if (loading) return <p role="status">正在确认登录状态…</p>
  if (error && !session) return <Navigate to="/login" replace state={{ from: location }} />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}
