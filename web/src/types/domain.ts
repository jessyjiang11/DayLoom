import { z } from 'zod'

const uuid = z.string().uuid()
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期必须使用 YYYY-MM-DD')
const timeOnly = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, '时间必须使用 HH:mm')
const timestamp = z.string().datetime({ offset: true })

export const itemKindSchema = z.enum(['direction', 'goal', 'project', 'task'])
export const itemStatusSchema = z.enum(['todo', 'doing', 'done', 'abandoned'])
export const scheduleGranularitySchema = z.enum(['month', 'week', 'day', 'time'])
export const periodTypeSchema = z.enum(['day', 'week', 'month'])

export const profileSchema = z.object({
  user_id: uuid,
  display_name: z.string().trim().min(1).max(60),
  avatar_url: z.string().url().nullable(),
  timezone: z.string().min(1),
  week_starts_on: z.number().int().min(0).max(6),
  preferences: z.record(z.string(), z.unknown()),
  onboarding_mode: z.enum(['sample', 'blank']).nullable(),
  created_at: timestamp,
  updated_at: timestamp,
})

export const planItemSchema = z.object({
  id: uuid,
  user_id: uuid,
  parent_id: uuid.nullable(),
  kind: itemKindSchema,
  title: z.string().trim().min(1).max(240),
  description: z.string(),
  status: itemStatusSchema,
  sort_order: z.number(),
  is_important: z.boolean(),
  is_focus: z.boolean(),
  schedule_granularity: scheduleGranularitySchema.nullable(),
  schedule_date: dateOnly.nullable(),
  schedule_start_time: timeOnly.nullable(),
  schedule_period_start: dateOnly.nullable(),
  schedule_period_end: dateOnly.nullable(),
  duration_minutes: z.number().int().positive().max(1440).nullable(),
  version: z.number().int().positive(),
  deleted_at: timestamp.nullable(),
  created_at: timestamp,
  updated_at: timestamp,
})

export const scheduleChangeSchema = z.object({
  id: uuid,
  user_id: uuid,
  item_id: uuid,
  from_schedule: z.record(z.string(), z.unknown()),
  to_schedule: z.record(z.string(), z.unknown()),
  reason: z.string().max(500).nullable(),
  changed_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp,
})

export const tagSchema = z.object({
  id: uuid,
  user_id: uuid,
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  created_at: timestamp,
  updated_at: timestamp,
})

export const periodNoteSchema = z.object({
  id: uuid,
  user_id: uuid,
  period_type: periodTypeSchema,
  period_start: dateOnly,
  focus_text: z.string().max(1000),
  note_text: z.string().max(4000),
  created_at: timestamp,
  updated_at: timestamp,
})

export const reviewSchema = z.object({
  id: uuid,
  user_id: uuid,
  period_type: periodTypeSchema,
  period_start: dateOnly,
  summary: z.string().max(4000),
  went_well: z.string().max(4000),
  blocked: z.string().max(4000),
  next_step: z.string().max(4000),
  created_at: timestamp,
  updated_at: timestamp,
})

export type Profile = z.infer<typeof profileSchema>
export type PlanItem = z.infer<typeof planItemSchema>
export type ScheduleChange = z.infer<typeof scheduleChangeSchema>
export type Tag = z.infer<typeof tagSchema>
export type PeriodNote = z.infer<typeof periodNoteSchema>
export type Review = z.infer<typeof reviewSchema>
export type ScheduleGranularity = z.infer<typeof scheduleGranularitySchema>
