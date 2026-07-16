import { createHashRouter, Navigate } from 'react-router-dom'
import { LazyAuthPage, LazyResetPasswordPage } from '../features/auth/LazyAuthPages'
import { WorkspacePlaceholder } from './WorkspacePlaceholder'

export const router = createHashRouter([
  { path: '/', element: <WorkspacePlaceholder /> },
  { path: '/login', element: <LazyAuthPage /> },
  { path: '/reset-password', element: <LazyResetPasswordPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
