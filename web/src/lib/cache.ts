import type { z } from 'zod'

type CacheEnvelope<T> = { savedAt: number; data: T }

export function userCacheKey(userId: string, key: string) {
  return `dayloom:${userId}:${key}`
}

export function writeUserCache<T>(storage: Storage, userId: string, key: string, data: T) {
  const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data }
  storage.setItem(userCacheKey(userId, key), JSON.stringify(envelope))
}

export function readUserCache<T>(
  storage: Storage,
  userId: string,
  key: string,
  schema: z.ZodType<T>,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
): T | null {
  const raw = storage.getItem(userCacheKey(userId, key))
  if (!raw) return null
  try {
    const envelope = JSON.parse(raw) as CacheEnvelope<unknown>
    if (!Number.isFinite(envelope.savedAt) || Date.now() - envelope.savedAt > maxAgeMs) return null
    const parsed = schema.safeParse(envelope.data)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function clearUserCache(storage: Storage, userId: string) {
  const prefix = `dayloom:${userId}:`
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (key?.startsWith(prefix)) storage.removeItem(key)
  }
}
