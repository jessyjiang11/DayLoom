import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { getHomePage, getProfile } from '../repositories/profileRepository'
import { useAuth } from '../features/auth/useAuth'

export function HomeRedirect() {
  const { client, user } = useAuth()
  const query = useQuery({ queryKey: ['profile', user?.id], enabled: Boolean(client && user), queryFn: () => getProfile(client!, user!.id) })
  if (query.isLoading) return <p role="status">正在打开首页…</p>
  return <Navigate to={`/${query.data ? getHomePage(query.data) : 'today'}`} replace />
}
