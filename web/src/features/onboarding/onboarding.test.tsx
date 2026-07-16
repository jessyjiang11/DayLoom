import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingForm } from './OnboardingPage'

describe('OnboardingForm', () => {
  it('requires a start mode before completion', async () => {
    const onComplete = vi.fn()
    render(<OnboardingForm initialName="小禾" initialTimezone="Asia/Shanghai" onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: '进入不秃' }))
    expect(screen.getByRole('alert')).toHaveTextContent('请选择一种开始方式')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('submits profile choices', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined)
    render(<OnboardingForm initialName="小禾" initialTimezone="Asia/Shanghai" onComplete={onComplete} />)
    await userEvent.click(screen.getByLabelText('先看看示例'))
    await userEvent.click(screen.getByRole('button', { name: '进入不秃' }))
    expect(onComplete).toHaveBeenCalledWith({
      displayName: '小禾', timezone: 'Asia/Shanghai', weekStartsOn: 1, mode: 'sample',
    })
  })
})
