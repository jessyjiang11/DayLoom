import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { periodNoteSchema, reviewSchema, type PeriodNote, type Review } from '../types/domain'

export const reviewKeys = { all: ['reviews'] as const, list: (userId: string) => ['reviews', userId] as const }
export const periodNoteKeys = { all: ['period-notes'] as const, list: (userId: string) => ['period-notes', userId] as const }

export async function listReviews(client: SupabaseClient, userId: string): Promise<Review[]> {
  const { data, error } = await client.from('reviews').select('*').eq('user_id', userId).order('period_start', { ascending: false })
  if (error) throw error
  return z.array(reviewSchema).parse(data)
}

export async function saveReview(client: SupabaseClient, review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
  const { data, error } = await client.from('reviews').upsert(review, { onConflict: 'user_id,period_type,period_start' }).select('*').single()
  if (error) throw error
  return reviewSchema.parse(data)
}

export async function listPeriodNotes(client: SupabaseClient, userId: string): Promise<PeriodNote[]> {
  const { data, error } = await client.from('period_notes').select('*').eq('user_id', userId).order('period_start', { ascending: false })
  if (error) throw error
  return z.array(periodNoteSchema).parse(data)
}

export async function savePeriodNote(client: SupabaseClient, note: Omit<PeriodNote, 'id' | 'created_at' | 'updated_at'>): Promise<PeriodNote> {
  const { data, error } = await client.from('period_notes').upsert(note, { onConflict: 'user_id,period_type,period_start' }).select('*').single()
  if (error) throw error
  return periodNoteSchema.parse(data)
}
