import type { SupabaseClient } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { ResetPasswordPage } from './ResetPasswordPage'

function resetClient(recovery = false) {
  const resetPasswordForEmail = vi.fn().mockResolvedValue({ data: {}, error: null })
  const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null })
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        if (recovery) queueMicrotask(() => callback('PASSWORD_RECOVERY', null))
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail,
      updateUser,
    },
  } as unknown as SupabaseClient

  return { client, resetPasswordForEmail, updateUser }
}

function renderReset(client: SupabaseClient) {
  render(
    <AuthProvider client={client}>
      <MemoryRouter><ResetPasswordPage /></MemoryRouter>
    </AuthProvider>,
  )
}

describe('ResetPasswordPage', () => {
  it('sends a reset email without revealing whether an account exists', async () => {
    const { client, resetPasswordForEmail } = resetClient()
    const visitor = userEvent.setup()
    renderReset(client)

    await visitor.type(screen.getByRole('textbox', { name: '注册邮箱' }), 'person@example.com')
    await visitor.click(screen.getByRole('button', { name: '发送重设邮件' }))

    expect(await screen.findByText(/如果该邮箱已注册/)).toBeInTheDocument()
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'person@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('#/reset-password') }),
    )
  })

  it('validates matching passwords during a recovery session', async () => {
    const { client, updateUser } = resetClient(true)
    const visitor = userEvent.setup()
    renderReset(client)

    expect(await screen.findByRole('heading', { name: '设置新密码' })).toBeInTheDocument()
    await visitor.type(screen.getByLabelText('新密码'), 'new-pass-123')
    await visitor.type(screen.getByLabelText('再次输入'), 'different-pass')
    await visitor.click(screen.getByRole('button', { name: '保存新密码' }))

    expect(screen.getByText('两次输入的密码不一致。')).toBeInTheDocument()
    expect(updateUser).not.toHaveBeenCalled()
  })
})
