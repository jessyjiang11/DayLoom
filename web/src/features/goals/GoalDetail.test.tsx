import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PlanItem } from '../../types/domain'
import { GoalDetail } from './GoalDetail'

const goal = {
  id: '1f6e4e74-dd04-4c6f-b932-b38dfeb8f9ba',
  user_id: '0f3b47e4-7748-4291-88d1-b29b53c98162',
  parent_id: null,
  kind: 'goal',
  title: '雅思 8.0',
  description: '',
  status: 'doing',
  sort_order: 1,
  is_important: false,
  is_focus: false,
  is_actionable: false,
  show_on_home: true,
  schedule_granularity: null,
  schedule_date: null,
  schedule_start_time: null,
  schedule_period_start: null,
  schedule_period_end: null,
  duration_minutes: null,
  version: 1,
  deleted_at: null,
  created_at: '2026-07-16T00:00:00Z',
  updated_at: '2026-07-16T00:00:00Z',
} as PlanItem

describe('GoalDetail', () => {
  it('keeps execution and home visibility as separate switches', async () => {
    const onToggleActionable = vi.fn()
    const onToggleHome = vi.fn()
    render(<GoalDetail item={goal} childCount={0} readOnly={false} onEdit={() => {}} onDelete={() => {}} onToggleActionable={onToggleActionable} onToggleHome={onToggleHome} />)
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('aria-checked', 'false')
    expect(switches[1]).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(switches[0]!)
    await userEvent.click(switches[1]!)
    expect(onToggleActionable).toHaveBeenCalledOnce()
    expect(onToggleHome).toHaveBeenCalledOnce()
  })
})
