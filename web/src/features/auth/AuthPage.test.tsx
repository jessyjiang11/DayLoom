import type { SupabaseClient } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { AuthPage } from './AuthPage'

function createAuthClient() {
  const signInWithPassword = vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword,
      signUp,
    },
  } as unknown as SupabaseClient
  return { client, signInWithPassword, signUp }
}

function renderPage(client: SupabaseClient) {
  return render(
    <AuthProvider client={client}>
      <MemoryRouter><AuthPage /></MemoryRouter>
    </AuthProvider>,
  )
}

describe('AuthPage', () => {
  it('shows useful validation errors before calling Supabase', async () => {
    const { client, signInWithPassword } = createAuthClient()
    const visitor = userEvent.setup()
    renderPage(client)

    await visitor.type(screen.getByRole('textbox', { name: '邮箱' }), '不是邮箱')
    await visitor.type(screen.getByLabelText('密码'), '123')
    await visitor.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByText('请输入有效的邮箱地址。')).toBeInTheDocument()
    expect(screen.getByText('密码至少需要 8 位。')).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('registers and explains that email verification is required', async () => {
    const { client, signUp } = createAuthClient()
    const visitor = userEvent.setup()
    renderPage(client)

    await visitor.click(screen.getByRole('tab', { name: '注册' }))
    await visitor.type(screen.getByRole('textbox', { name: '邮箱' }), 'new@example.com')
    await visitor.type(screen.getByLabelText('密码'), 'safe-pass-123')
    await visitor.click(screen.getByRole('button', { name: '创建账户' }))

    expect(await screen.findByText(/验证邮件已经发送/)).toBeInTheDocument()
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      password: 'safe-pass-123',
    }))
  })

  it('translates authentication errors instead of exposing internals', async () => {
    const { client, signInWithPassword } = createAuthClient()
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: 'invalid_credentials', message: 'Internal provider message' },
    })
    const visitor = userEvent.setup()
    renderPage(client)

    await visitor.type(screen.getByRole('textbox', { name: '邮箱' }), 'person@example.com')
    await visitor.type(screen.getByLabelText('密码'), 'wrong-pass')
    await visitor.click(screen.getByRole('button', { name: '登录' }))

    expect(await screen.findByText('邮箱或密码不正确，请重新检查。')).toBeInTheDocument()
    expect(screen.queryByText(/Internal provider/)).not.toBeInTheDocument()
  })

  it('disables the submit button while login is in progress', async () => {
    const { client, signInWithPassword } = createAuthClient()
    signInWithPassword.mockReturnValue(new Promise(() => undefined))
    const visitor = userEvent.setup()
    renderPage(client)

    await visitor.type(screen.getByRole('textbox', { name: '邮箱' }), 'person@example.com')
    await visitor.type(screen.getByLabelText('密码'), 'safe-pass-123')
    await visitor.click(screen.getByRole('button', { name: '登录' }))

    expect(screen.getByRole('button', { name: '正在登录' })).toBeDisabled()
  })
})
