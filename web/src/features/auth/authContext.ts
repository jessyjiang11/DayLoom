import { createContext } from 'react'
import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js'

export type AuthContextValue = {
  client: SupabaseClient | null
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  authEvent: AuthChangeEvent | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
