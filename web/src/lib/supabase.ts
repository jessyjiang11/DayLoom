import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseEnvironment = {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export class SupabaseConfigurationError extends Error {
  constructor() {
    super('Supabase 尚未配置，请填写 Project URL 和 publishable key。')
    this.name = 'SupabaseConfigurationError'
  }
}

let browserClient: SupabaseClient | undefined

export function createSupabaseBrowserClient(environment: SupabaseEnvironment): SupabaseClient {
  const url = environment.VITE_SUPABASE_URL?.trim()
  const publishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) throw new SupabaseConfigurationError()

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export function getSupabaseClient(): SupabaseClient {
  browserClient ??= createSupabaseBrowserClient({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  })
  return browserClient
}

export function tryGetSupabaseClient(): SupabaseClient | null {
  try {
    return getSupabaseClient()
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return null
    throw error
  }
}
