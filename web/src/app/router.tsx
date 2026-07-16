import { createHashRouter, Navigate } from 'react-router-dom'
import { LazyAuthPage, LazyResetPasswordPage } from '../features/auth/LazyAuthPages'
import { OnboardingGate } from '../features/onboarding/OnboardingGate'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { AppShell } from './AppShell'
import { RoutePlaceholder } from './RoutePlaceholder'

export const router = createHashRouter([
  {
    path: '/',
    element: <OnboardingGate><AppShell /></OnboardingGate>,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <RoutePlaceholder kicker="今日" title="今天，慢慢来。" description="先把最重要的一小步完成。" /> },
      { path: 'goals', element: <RoutePlaceholder kicker="目标" title="目标不是梯子，是方向。" description="把想做的事情放进一棵能随时调整的树。" /> },
      { path: 'planner', element: <RoutePlaceholder kicker="计划" title="把以后，放到看得见的地方。" description="先安排到一个大概周期，再慢慢具体到某一天。" /> },
      { path: 'reviews', element: <RoutePlaceholder kicker="复盘" title="看见走过的路。" description="记录发生了什么，也记录自己怎样慢慢成长。" /> },
      { path: 'settings', element: <RoutePlaceholder kicker="设置" title="让这里更像你。" description="管理账户、时间习惯与数据。" /> },
    ],
  },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/login', element: <LazyAuthPage /> },
  { path: '/reset-password', element: <LazyResetPasswordPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
