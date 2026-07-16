import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { profileSchema, type Profile } from '../types/domain'

export const onboardingInputSchema = z.object({
  displayName: z.string().trim().min(1, '请写下怎么称呼你').max(60, '称呼最多 60 个字'),
  timezone: z.string().trim().min(1, '请选择时区'),
  weekStartsOn: z.number().int().min(0).max(6),
  mode: z.enum(['sample', 'blank'], { message: '请选择一种开始方式' }),
})

export type OnboardingInput = z.infer<typeof onboardingInputSchema>

export const homePageSchema = z.enum(['today', 'goals', 'planner', 'reviews'])
export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1, '请写下怎么称呼你').max(60),
  timezone: z.string().trim().min(1),
  weekStartsOn: z.number().int().min(0).max(6),
  homePage: homePageSchema,
})
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>

export async function getProfile(client: SupabaseClient, userId: string): Promise<Profile> {
  const { data, error } = await client.from('profiles').select('*').eq('user_id', userId).single()
  if (error) throw error
  return profileSchema.parse(data)
}

export async function saveProfile(
  client: SupabaseClient,
  userId: string,
  input: OnboardingInput,
): Promise<Profile> {
  const value = onboardingInputSchema.parse(input)
  const { data, error } = await client
    .from('profiles')
    .upsert({
      user_id: userId,
      display_name: value.displayName,
      timezone: value.timezone,
      week_starts_on: value.weekStartsOn,
      onboarding_mode: value.mode,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return profileSchema.parse(data)
}

export async function createSampleWorkspace(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc('create_sample_workspace')
  if (error) throw error
  return z.boolean().parse(data)
}

export function getHomePage(profile: Profile) {
  const parsed = homePageSchema.safeParse(profile.preferences.home_page)
  return parsed.success ? parsed.data : 'today'
}

export async function updateProfileSettings(client: SupabaseClient, userId: string, profile: Profile, input: ProfileSettingsInput): Promise<Profile> {
  const value = profileSettingsSchema.parse(input)
  const { data, error } = await client.from('profiles').update({
    display_name: value.displayName,
    timezone: value.timezone,
    week_starts_on: value.weekStartsOn,
    preferences: { ...profile.preferences, home_page: value.homePage },
  }).eq('user_id', userId).select('*').single()
  if (error) throw error
  return profileSchema.parse(data)
}
