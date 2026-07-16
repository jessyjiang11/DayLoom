import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseBrowserClient, SupabaseConfigurationError } from '../../lib/supabase'
import { AuthProvider } from './AuthProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from './useAuth'

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'person@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-07-16T00:00:00Z',
}

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user,
} as Session

function mockClient(initialSession: Session | null) {
  const unsubscribe = vi.fn()
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: initialSession }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe } } }),
      signOut,
    },
  } as unknown as SupabaseClient

  return { client, signOut, unsubscribe }
}

function AccountProbe() {
  const { user: currentUser, loading, signOut } = useAuth()
  if (loading) return <p>载入中</p>
  return (
    <div>
      <p>{currentUser?.email ?? '未登录'}</p>
      <button type="button" onClick={() => void signOut()}>退出</button>
    </div>
  )
}

describe('Supabase client configuration', () => {
  it('fails clearly when public environment values are missing', () => {
    expect(() => createSupabaseBrowserClient({})).toThrow(SupabaseConfigurationError)
  })
})

describe('AuthProvider', () => {
  it('restores the current session and signs out only this device', async () => {
    const { client, signOut } = mockClient(session)
    const browserUser = userEvent.setup()
    render(<AuthProvider client={client}><AccountProbe /></AuthProvider>)

    expect(await screen.findByText('person@example.com')).toBeInTheDocument()
    await browserUser.click(screen.getByRole('button', { name: '退出' }))
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to the login page', async () => {
    const { client } = mockClient(null)
    render(
      <AuthProvider client={client}>
        <MemoryRouter initialEntries={['/today']}>
          <Routes>
            <Route path="/login" element={<p>登录页面</p>} />
            <Route path="/today" element={<ProtectedRoute><p>今日页面</p></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('登录页面')).toBeInTheDocument())
    expect(screen.queryByText('今日页面')).not.toBeInTheDocument()
  })
})
