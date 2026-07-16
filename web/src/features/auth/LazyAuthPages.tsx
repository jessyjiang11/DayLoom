import { lazy, Suspense } from 'react'

const AuthPage = lazy(() => import('./AuthPage').then((module) => ({ default: module.AuthPage })))
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))

function PageLoading() {
  return <p role="status">正在打开页面…</p>
}

export function LazyAuthPage() {
  return <Suspense fallback={<PageLoading />}><AuthPage /></Suspense>
}

export function LazyResetPasswordPage() {
  return <Suspense fallback={<PageLoading />}><ResetPasswordPage /></Suspense>
}
