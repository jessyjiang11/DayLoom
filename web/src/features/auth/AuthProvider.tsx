import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { tryGetSupabaseClient } from '../../lib/supabase'
import { AuthContext, type AuthContextValue } from './authContext'

type AuthProviderProps = {
  children: ReactNode
  client?: SupabaseClient | null
}

export function AuthProvider({ children, client: suppliedClient }: AuthProviderProps) {
  const client = useMemo(
    () => suppliedClient === undefined ? tryGetSupabaseClient() : suppliedClient,
    [suppliedClient],
  )
  const [session, setSession] = useState<Session | null>(null)
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null)
  const [loading, setLoading] = useState(Boolean(client))
  const [error, setError] = useState<string | null>(
    client ? null : '云端服务尚未配置，暂时无法登录。',
  )

  useEffect(() => {
    if (!client) return

    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setAuthEvent(event)
      setSession(nextSession)
      setLoading(false)
      setError(null)
    })

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError('无法恢复登录状态，请检查网络后重试。')
      } else {
        setSession(data.session)
      }
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo<AuthContextValue>(() => ({
    client,
    session,
    user: session?.user ?? null,
    loading,
    error,
    authEvent,
    signOut: async () => {
      if (!client) return
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' })
      if (signOutError) throw signOutError
    },
  }), [authEvent, client, error, loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
