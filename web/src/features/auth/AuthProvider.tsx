import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { tryGetSupabaseClient } from '../../lib/supabase'

type AuthContextValue = {
  client: SupabaseClient | null
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
  const [loading, setLoading] = useState(Boolean(client))
  const [error, setError] = useState<string | null>(
    client ? null : '云端服务尚未配置，暂时无法登录。',
  )

  useEffect(() => {
    if (!client) return

    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
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
    signOut: async () => {
      if (!client) return
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' })
      if (signOutError) throw signOutError
    },
  }), [client, error, loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return context
}
