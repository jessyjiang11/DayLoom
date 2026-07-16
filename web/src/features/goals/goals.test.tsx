import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PlanItem } from '../../types/domain'
import { GoalTree } from './GoalTree'
import { ItemEditor } from '../items/ItemEditor'

const base = { id: '1', user_id: 'u', parent_id: null, kind: 'goal', title: '学会独立创作', description: '', status: 'doing', sort_order: 1, is_important: false, is_focus: false, schedule_granularity: null, schedule_date: null, schedule_start_time: null, schedule_period_start: null, schedule_period_end: null, duration_minutes: null, version: 1, deleted_at: null, created_at: '2026-07-16T00:00:00Z', updated_at: '2026-07-16T00:00:00Z' } as PlanItem
const child = { ...base, id: '2', parent_id: '1', kind: 'task', title: '完成第一个作品' } as PlanItem

describe('GoalTree', () => {
  it('selects nodes, adds children and collapses branches', async () => {
    const onSelect = vi.fn(); const onAddChild = vi.fn(); render(<GoalTree items={[base, child]} onSelect={onSelect} onAddChild={onAddChild} />)
    await userEvent.click(screen.getByText('学会独立创作')); expect(onSelect).toHaveBeenCalledWith(base)
    await userEvent.click(screen.getByRole('button', { name: '为学会独立创作添加子计划' })); expect(onAddChild).toHaveBeenCalledWith(base)
    await userEvent.click(screen.getByRole('button', { name: '收起学会独立创作' })); expect(screen.queryByText('完成第一个作品')).not.toBeInTheDocument()
  })
})

describe('ItemEditor', () => {
  it('shows the calendar control that matches schedule granularity', async () => {
    render(<ItemEditor open onClose={() => {}} onSave={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('某个月')); expect(screen.getByLabelText('选择月份')).toHaveAttribute('type', 'month')
    await userEvent.click(screen.getByLabelText('具体时间')); expect(screen.getByLabelText('开始时间')).toHaveAttribute('type', 'time')
  })
})
