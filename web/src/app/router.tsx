import { createHashRouter, Navigate } from 'react-router-dom'
import { LazyAuthPage, LazyResetPasswordPage } from '../features/auth/LazyAuthPages'
import { OnboardingGate } from '../features/onboarding/OnboardingGate'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { AppShell } from './AppShell'
import { RoutePlaceholder } from './RoutePlaceholder'
import { GoalsPage } from '../features/goals/GoalsPage'
import { TodayPage } from '../features/today/TodayPage'
import { PlannerPage } from '../features/planner/PlannerPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <OnboardingGate><AppShell /></OnboardingGate>,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'reviews', element: <RoutePlaceholder kicker="复盘" title="看见走过的路。" description="记录发生了什么，也记录自己怎样慢慢成长。" /> },
      { path: 'settings', element: <RoutePlaceholder kicker="设置" title="让这里更像你。" description="管理账户、时间习惯与数据。" /> },
    ],
  },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LazyAuthPage /> },
  { path: '/reset-password', element: <LazyResetPasswordPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
