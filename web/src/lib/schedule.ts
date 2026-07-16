import { endOfWeek, format, parseISO, startOfWeek, type Day } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ScheduleGranularity } from '../types/domain'

type ScheduleLike = {
  schedule_granularity: ScheduleGranularity | null
  schedule_date?: string | null
  schedule_start_time?: string | null
  schedule_period_start?: string | null
  schedule_period_end?: string | null
}

const formatDate = (date: Date, pattern: string) => format(date, pattern, { locale: zhCN })

export function getWeekRange(referenceDate: string, weekStartsOn: Day = 1) {
  const reference = parseISO(referenceDate)

  return {
    start: formatDate(startOfWeek(reference, { weekStartsOn }), 'yyyy-MM-dd'),
    end: formatDate(endOfWeek(reference, { weekStartsOn }), 'yyyy-MM-dd'),
  }
}

export function formatScheduleLabel(schedule: ScheduleLike): string {
  switch (schedule.schedule_granularity) {
    case null:
      return '未安排'
    case 'month':
      return schedule.schedule_period_start
        ? formatDate(parseISO(schedule.schedule_period_start), 'yyyy年M月')
        : '月份待确认'
    case 'week':
      return schedule.schedule_period_start && schedule.schedule_period_end
        ? `${formatDate(parseISO(schedule.schedule_period_start), 'M月d日')}—${formatDate(parseISO(schedule.schedule_period_end), 'M月d日')}`
        : '周次待确认'
    case 'day':
      return schedule.schedule_date
        ? formatDate(parseISO(schedule.schedule_date), 'M月d日 EEE')
        : '日期待确认'
    case 'time':
      return schedule.schedule_date && schedule.schedule_start_time
        ? `${formatDate(parseISO(schedule.schedule_date), 'M月d日')} ${schedule.schedule_start_time.slice(0, 5)}`
        : '时间待确认'
  }
}
