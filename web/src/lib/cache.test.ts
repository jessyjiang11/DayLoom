import { z } from 'zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearUserCache, readUserCache, writeUserCache } from './cache'

describe('user cache', () => {
  beforeEach(() => localStorage.clear())

  it('isolates cached data by user id', () => {
    writeUserCache(localStorage, 'user-a', 'items', [{ title: 'A' }])
    expect(readUserCache(localStorage, 'user-a', 'items', z.array(z.object({ title: z.string() })))).toEqual([{ title: 'A' }])
    expect(readUserCache(localStorage, 'user-b', 'items', z.array(z.object({ title: z.string() })))).toBeNull()
  })

  it('rejects stale or malformed cached data', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(500)
    writeUserCache(localStorage, 'user-a', 'items', ['wrong'])
    expect(readUserCache(localStorage, 'user-a', 'items', z.array(z.number()), 200)).toBeNull()
    vi.restoreAllMocks()
  })

  it('clears only one user namespace', () => {
    writeUserCache(localStorage, 'user-a', 'items', [1])
    writeUserCache(localStorage, 'user-b', 'items', [2])
    clearUserCache(localStorage, 'user-a')
    expect(localStorage.length).toBe(1)
  })
})
