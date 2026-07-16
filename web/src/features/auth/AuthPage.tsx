import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { useAuth } from './useAuth'
import { getAuthErrorMessage } from './authErrors'
import './auth.css'

type AuthMode = 'login' | 'register'

const credentialsSchema = z.object({
  email: z.string().trim().email('请输入有效的邮箱地址。').max(254),
  password: z.string().min(8, '密码至少需要 8 位。').max(128, '密码不能超过 128 位。'),
})

type FieldErrors = Partial<Record<'email' | 'password', string>>

export function AuthPage() {
  const { client } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setFieldErrors({})
    setMessage(null)
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setFormError(null)

    const parsed = credentialsSchema.safeParse({ email, password })
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      setFieldErrors({ email: flattened.email?.[0], password: flattened.password?.[0] })
      return
    }

    setFieldErrors({})
    if (!client) {
      setFormError('云端服务尚未配置，暂时无法登录。')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { data, error } = await client.auth.signInWithPassword(parsed.data)
        if (error) throw error
        if (data.session) {
          const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
          navigate(from ?? '/', { replace: true })
        }
      } else {
        const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/login`
        const { error } = await client.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo },
        })
        if (error) throw error
        setMessage('验证邮件已经发送。完成邮箱验证后，就可以登录不秃。')
      }
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-brand">
        <span className="auth-brand__mark" aria-hidden="true">不</span>
        <div>
          <strong>不秃</strong>
          <span>DayLoom</span>
        </div>
      </header>

      <section className="auth-sheet" aria-labelledby="auth-heading">
        <p className="auth-index">01 · ACCOUNT</p>
        <h1 id="auth-heading">{mode === 'login' ? '继续你的计划' : '建立你的计划本'}</h1>
        <p className="auth-lead">
          {mode === 'login'
            ? '登录后，目标、排期与复盘会保存在你的个人账户中。'
            : '先从一个账户开始。之后可以选择示例内容，或完全空白地开始。'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="账户操作">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>登录</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>注册</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Field
            label="邮箱"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <Field
            label="密码"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint={mode === 'register' ? '至少 8 位，请不要使用其他网站的相同密码。' : undefined}
            error={fieldErrors.password}
          />

          {formError ? <p className="auth-message auth-message--error" role="alert">{formError}</p> : null}
          {message ? <p className="auth-message auth-message--success" role="status">{message}</p> : null}

          <Button type="submit" loading={submitting} loadingLabel={mode === 'login' ? '正在登录' : '正在注册'}>
            {mode === 'login' ? '登录' : '创建账户'}
          </Button>
        </form>

        {mode === 'login' ? <Link className="auth-link" to="/reset-password">忘记密码？</Link> : null}
      </section>

      <footer className="auth-footer">你的数据只属于你的账户。</footer>
    </main>
  )
}
