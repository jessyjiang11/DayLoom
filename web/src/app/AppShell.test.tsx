import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SyncContext } from '../features/sync/syncContext'
import { AppShell } from './AppShell'
import { RoutePlaceholder } from './RoutePlaceholder'

function renderShell(initialEntry = '/today') {
  const router = createMemoryRouter([{
    path: '/', element: <AppShell />, children: [{ path: 'today', element: <RoutePlaceholder kicker="今天" title="今天，慢慢来。" description="测试" /> }],
  }], { initialEntries: [initialEntry] })
  return render(<QueryClientProvider client={new QueryClient()}><SyncContext.Provider value={{ state: 'saved', readOnly: false, reportNetworkError() {}, reportNetworkSuccess() {} }}><RouterProvider router={router} /></SyncContext.Provider></QueryClientProvider>)
}

describe('AppShell', () => {
  it('shows desktop and mobile navigation with the active route', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '手机主导航' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '今日' })[0]).toHaveClass('is-active')
    expect(screen.getByRole('status')).toHaveTextContent('已保存')
  })

  it('keeps quick capture available in the application frame', () => {
    renderShell()
    expect(screen.getByRole('textbox', { name: '快速记录' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: '今天，慢慢来。' })).toBeInTheDocument()
  })
})
