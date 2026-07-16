import { createHashRouter, Navigate } from 'react-router-dom'
import { LazyAuthPage, LazyResetPasswordPage } from '../features/auth/LazyAuthPages'
import { OnboardingGate } from '../features/onboarding/OnboardingGate'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { AppShell } from './AppShell'
import { GoalsPage } from '../features/goals/GoalsPage'
import { TodayPage } from '../features/today/TodayPage'
import { PlannerPage } from '../features/planner/PlannerPage'
import { ReviewPage } from '../features/reviews/ReviewPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { HomeRedirect } from './HomeRedirect'

export const router = createHashRouter([
  {
    path: '/',
    element: <OnboardingGate><AppShell /></OnboardingGate>,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'reviews', element: <ReviewPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LazyAuthPage /> },
  { path: '/reset-password', element: <LazyResetPasswordPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
