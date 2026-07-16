import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import {
  createSampleWorkspace,
  onboardingInputSchema,
  saveProfile,
  type OnboardingInput,
} from '../../repositories/profileRepository'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/useAuth'
import './onboarding.css'

type OnboardingFormProps = {
  initialName: string
  initialTimezone: string
  onComplete: (input: OnboardingInput) => Promise<void>
}

export function OnboardingForm({ initialName, initialTimezone, onComplete }: OnboardingFormProps) {
  const [displayName, setDisplayName] = useState(initialName)
  const [timezone, setTimezone] = useState(initialTimezone)
  const [weekStartsOn, setWeekStartsOn] = useState(1)
  const [mode, setMode] = useState<'sample' | 'blank' | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = onboardingInputSchema.safeParse({ displayName, timezone, weekStartsOn, mode })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请补全设置')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onComplete(parsed.data)
    } catch {
      setError('保存失败了，请检查网络后再试一次。')
      setSaving(false)
    }
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <p className="eyebrow">不秃 · 第一次见面</p>
        <h1>先把这里变成你的。</h1>
        <p>只需要一分钟。这些设置以后都可以修改。</p>
      </header>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <section className="onboarding-section" aria-labelledby="basic-title">
          <div className="onboarding-section__number">01</div>
          <div className="onboarding-section__content">
            <h2 id="basic-title">怎么称呼你</h2>
            <Field label="显示名称" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <div className="onboarding-pair">
              <label className="ui-field">
                <span className="ui-field__label">每周从哪天开始</span>
                <select className="ui-field__control" value={weekStartsOn} onChange={(event) => setWeekStartsOn(Number(event.target.value))}>
                  <option value={1}>周一</option>
                  <option value={0}>周日</option>
                  <option value={6}>周六</option>
                </select>
              </label>
              <Field label="所在时区" value={timezone} onChange={(event) => setTimezone(event.target.value)} hint="排期和提醒会按这个时区显示" />
            </div>
          </div>
        </section>

        <section className="onboarding-section" aria-labelledby="start-title">
          <div className="onboarding-section__number">02</div>
          <div className="onboarding-section__content">
            <h2 id="start-title">想从哪里开始</h2>
            <div className="start-options">
              <label className={`start-option ${mode === 'sample' ? 'is-selected' : ''}`}>
                <input aria-label="先看看示例" type="radio" name="mode" value="sample" checked={mode === 'sample'} onChange={() => setMode('sample')} />
                <span><strong>先看看示例</strong><small>放入一棵目标树和三件任务，随时可以删除。</small></span>
              </label>
              <label className={`start-option ${mode === 'blank' ? 'is-selected' : ''}`}>
                <input aria-label="从空白开始" type="radio" name="mode" value="blank" checked={mode === 'blank'} onChange={() => setMode('blank')} />
                <span><strong>从空白开始</strong><small>只保留你的账户设置，第一件事由你写下。</small></span>
              </label>
            </div>
          </div>
        </section>

        <footer className="onboarding-footer">
          {error && <p role="alert">{error}</p>}
          <Button type="submit" loading={saving} loadingLabel="正在准备">进入不秃</Button>
        </footer>
      </form>
    </main>
  )
}

function OnboardingContent() {
  const { client, user } = useAuth()
  const navigate = useNavigate()
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai', [])
  if (!client || !user) return <Navigate to="/login" replace />

  const initialName = String(user.user_metadata.display_name ?? user.email?.split('@')[0] ?? '新用户')
  return (
    <OnboardingForm
      initialName={initialName}
      initialTimezone={timezone}
      onComplete={async (input) => {
        await saveProfile(client, user.id, input)
        if (input.mode === 'sample') await createSampleWorkspace(client)
        navigate('/', { replace: true })
      }}
    />
  )
}

export function OnboardingPage() {
  return <ProtectedRoute><OnboardingContent /></ProtectedRoute>
}
