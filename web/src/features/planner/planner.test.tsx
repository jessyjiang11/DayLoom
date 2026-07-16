import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import type { PlanItem } from '../../types/domain'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { scheduleFromDropId } from './plannerSchedule'

const item = { id: '1', user_id: 'u', parent_id: null, kind: 'task', title: '写周计划', description: '', status: 'todo', sort_order: 1, is_important: false, is_focus: false, schedule_granularity: 'week', schedule_date: null, schedule_start_time: null, schedule_period_start: '2026-07-13', schedule_period_end: '2026-07-19', duration_minutes: null, version: 1, deleted_at: null, created_at: '2026-07-16T00:00:00Z', updated_at: '2026-07-16T00:00:00Z' } as PlanItem

describe('planner scheduling', () => {
  it('maps coarse and daily drop targets to separate schedule shapes', () => {
    expect(scheduleFromDropId('day:2026-07-16')).toMatchObject({ schedule_granularity: 'day', schedule_date: '2026-07-16' })
    expect(scheduleFromDropId('week:2026-07-16')).toMatchObject({ schedule_granularity: 'week', schedule_period_start: '2026-07-13' })
    expect(scheduleFromDropId('unscheduled')).toMatchObject({ schedule_granularity: null, schedule_date: null })
  })
  it('shows explicit weekly and monthly plan areas', () => {
    const { rerender } = render(<DndContext><WeekView referenceDate="2026-07-16" items={[item]} /></DndContext>)
    expect(screen.getByLabelText('本周计划')).toHaveTextContent('写周计划'); expect(screen.getByText('本周重点')).toBeInTheDocument()
    rerender(<DndContext><MonthView referenceDate="2026-07-16" items={[]} /></DndContext>); expect(screen.getByLabelText('本月计划')).toBeInTheDocument()
  })
  it('adds a task by clicking a date', async () => {
    const onAdd = vi.fn()
    render(<DndContext><WeekView referenceDate="2026-07-16" items={[]} onAdd={onAdd} /></DndContext>)
    await userEvent.click(screen.getByRole('button', { name: '在7月13日添加任务' }))
    expect(onAdd).toHaveBeenCalledWith('2026-07-13')
  })
  it('adds a plan directly to the visible week or month', async () => {
    const onAddToWeek = vi.fn()
    const onAddToMonth = vi.fn()
    const { rerender } = render(<DndContext><WeekView referenceDate="2026-07-16" items={[]} onAddToWeek={onAddToWeek} /></DndContext>)
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加' }))
    expect(onAddToWeek).toHaveBeenCalledWith('2026-07-13')

    rerender(<DndContext><MonthView referenceDate="2026-07-16" items={[]} onAddToMonth={onAddToMonth} /></DndContext>)
    await userEvent.click(screen.getByRole('button', { name: '＋ 添加' }))
    expect(onAddToMonth).toHaveBeenCalledWith('2026-07-16')
  })
})
