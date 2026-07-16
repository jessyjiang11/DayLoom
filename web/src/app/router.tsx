import { createHashRouter, Navigate } from 'react-router-dom'
import { LazyAuthPage, LazyResetPasswordPage } from '../features/auth/LazyAuthPages'
import { OnboardingGate } from '../features/onboarding/OnboardingGate'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'

export const router = createHashRouter([
  { path: '/', element: <OnboardingGate /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LazyAuthPage /> },
  { path: '/reset-password', element: <LazyResetPasswordPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
