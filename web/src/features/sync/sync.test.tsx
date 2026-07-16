import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import { SyncProvider } from './SyncProvider'
import { useSync } from './useSync'

const auth = { user: { id: 'user-1' }, session: {}, loading: false, error: null } as unknown as AuthContextValue

function Probe() {
  const sync = useSync()
  return <output>{sync.state}:{sync.readOnly ? '只读' : '可写'}</output>
}

function wrapper(children: ReactNode) {
  return <QueryClientProvider client={new QueryClient()}><AuthContext.Provider value={auth}><SyncProvider>{children}</SyncProvider></AuthContext.Provider></QueryClientProvider>
}

describe('SyncProvider', () => {
  beforeEach(() => vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true))

  it('becomes read-only when offline', () => {
    render(wrapper(<Probe />))
    act(() => window.dispatchEvent(new Event('offline')))
    expect(screen.getByText('offline:只读')).toBeInTheDocument()
  })

  it('refreshes and becomes writable after reconnecting', async () => {
    render(wrapper(<Probe />))
    act(() => window.dispatchEvent(new Event('offline')))
    await act(async () => window.dispatchEvent(new Event('online')))
    expect(screen.getByText('saved:可写')).toBeInTheDocument()
  })
})
