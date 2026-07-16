import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { getWeekRange } from '../../lib/schedule'
import type { ScheduleUpdate } from '../../repositories/itemRepository'

const empty = { schedule_date: null, schedule_start_time: null, schedule_period_start: null, schedule_period_end: null }

export function scheduleFromDropId(dropId: string): ScheduleUpdate | null {
  const [kind, reference] = dropId.split(':')
  if (kind === 'unscheduled') return { ...empty, schedule_granularity: null }
  if (!reference) return null
  if (kind === 'day') return { ...empty, schedule_granularity: 'day', schedule_date: reference }
  if (kind === 'week') {
    const range = getWeekRange(reference)
    return { ...empty, schedule_granularity: 'week', schedule_period_start: range.start, schedule_period_end: range.end }
  }
  if (kind === 'month') return {
    ...empty,
    schedule_granularity: 'month',
    schedule_period_start: format(startOfMonth(parseISO(reference)), 'yyyy-MM-dd'),
    schedule_period_end: format(endOfMonth(parseISO(reference)), 'yyyy-MM-dd'),
  }
  return null
}
