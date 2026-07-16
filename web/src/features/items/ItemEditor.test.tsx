import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ItemEditor } from './ItemEditor'

describe('ItemEditor initial schedule', () => {
  it('creates a directly scheduled plan as an actionable task', () => {
    render(<ItemEditor open initialSchedule={{ granularity: 'week', date: '2026-07-13' }} onClose={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText('角色')).toHaveValue('task')
    expect(screen.getByRole('checkbox', { name: /作为执行项/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: '某一周' })).toBeChecked()
    expect(screen.getByLabelText('选择这一周中的任意一天')).toHaveValue('2026-07-13')
  })
})
