import { describe, expect, it } from 'vitest'
import { formatScheduleLabel, getWeekRange } from './schedule'

describe('formatScheduleLabel', () => {
  it('shows an explicit label for an unscheduled item', () => {
    expect(formatScheduleLabel({ schedule_granularity: null })).toBe('未安排')
  })

  it('formats a month-level plan', () => {
    expect(formatScheduleLabel({
      schedule_granularity: 'month',
      schedule_period_start: '2026-07-01',
      schedule_period_end: '2026-07-31',
    })).toBe('2026年7月')
  })

  it('formats a week-level plan', () => {
    expect(formatScheduleLabel({
      schedule_granularity: 'week',
      schedule_period_start: '2026-07-13',
      schedule_period_end: '2026-07-19',
    })).toBe('7月13日—7月19日')
  })

  it('formats a day-level plan', () => {
    expect(formatScheduleLabel({
      schedule_granularity: 'day',
      schedule_date: '2026-07-14',
    })).toBe('7月14日 周二')
  })

  it('formats a plan with a concrete start time', () => {
    expect(formatScheduleLabel({
      schedule_granularity: 'time',
      schedule_date: '2026-07-14',
      schedule_start_time: '09:30:00',
    })).toBe('7月14日 09:30')
  })
})

describe('getWeekRange', () => {
  it('uses Monday as the default start of week', () => {
    expect(getWeekRange('2026-07-14')).toEqual({
      start: '2026-07-13',
      end: '2026-07-19',
    })
  })

  it('supports a user preference for Sunday', () => {
    expect(getWeekRange('2026-07-14', 0)).toEqual({
      start: '2026-07-12',
      end: '2026-07-18',
    })
  })

  it('keeps the correct dates when a week crosses a month', () => {
    expect(getWeekRange('2026-08-01')).toEqual({
      start: '2026-07-27',
      end: '2026-08-02',
    })
  })
})
