import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { WorkspacePlaceholder } from '../../app/WorkspacePlaceholder'
import { getProfile } from '../../repositories/profileRepository'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useAuth } from '../auth/useAuth'

function GateContent() {
  const { client, user } = useAuth()
  const [state, setState] = useState<'loading' | 'ready' | 'onboarding' | 'error'>('loading')

  useEffect(() => {
    if (!client || !user) return
    let active = true
    void getProfile(client, user.id)
      .then((profile) => active && setState(profile.onboarding_mode ? 'ready' : 'onboarding'))
      .catch(() => active && setState('error'))
    return () => { active = false }
  }, [client, user])

  if (state === 'onboarding') return <Navigate to="/onboarding" replace />
  if (state === 'ready') return <WorkspacePlaceholder />
  if (state === 'error') return <p role="alert" className="route-message">暂时无法读取你的空间，请刷新后重试。</p>
  return <p role="status" className="route-message">正在准备你的空间…</p>
}

export function OnboardingGate() {
  return <ProtectedRoute><GateContent /></ProtectedRoute>
}
