import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { useAuth } from './useAuth'
import { getAuthErrorMessage } from './authErrors'
import './auth.css'

const emailSchema = z.string().trim().email('请输入有效的邮箱地址。').max(254)
const passwordSchema = z.string().min(8, '新密码至少需要 8 位。').max(128)

export function ResetPasswordPage() {
  const { client, authEvent } = useAuth()
  const recoveryMode = authEvent === 'PASSWORD_RECOVERY'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请输入有效邮箱。')
      return
    }
    if (!client) {
      setError('云端服务尚未配置，暂时无法发送邮件。')
      return
    }

    setSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/reset-password`
      const { error: requestError } = await client.auth.resetPasswordForEmail(parsed.data, { redirectTo })
      if (requestError) throw requestError
      setMessage('如果该邮箱已注册，你会收到一封重设密码邮件。')
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查新密码。')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。')
      return
    }
    if (!client) {
      setError('云端服务尚未配置，暂时无法更新密码。')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await client.auth.updateUser({ password })
      if (updateError) throw updateError
      setMessage('密码已经更新，可以返回登录。')
    } catch (updateError) {
      setError(getAuthErrorMessage(updateError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-brand">
        <span className="auth-brand__mark" aria-hidden="true">不</span>
        <div><strong>不秃</strong><span>DayLoom</span></div>
      </header>
      <section className="auth-sheet" aria-labelledby="reset-heading">
        <p className="auth-index">02 · RECOVERY</p>
        <h1 id="reset-heading">{recoveryMode ? '设置新密码' : '找回密码'}</h1>
        <p className="auth-lead">
          {recoveryMode ? '输入一个新的密码，之后用它继续登录。' : '我们会向你的邮箱发送一封安全链接。'}
        </p>

        <form className="auth-form" onSubmit={recoveryMode ? handlePasswordUpdate : handleResetRequest} noValidate>
          {recoveryMode ? (
            <>
              <Field label="新密码" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Field label="再次输入" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </>
          ) : (
            <Field label="注册邮箱" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          )}

          {error ? <p className="auth-message auth-message--error" role="alert">{error}</p> : null}
          {message ? <p className="auth-message auth-message--success" role="status">{message}</p> : null}
          <Button type="submit" loading={submitting}>
            {recoveryMode ? '保存新密码' : '发送重设邮件'}
          </Button>
        </form>
        <Link className="auth-link" to="/login">返回登录</Link>
      </section>
    </main>
  )
}
