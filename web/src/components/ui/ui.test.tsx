import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Field } from './Field'

describe('Button', () => {
  it('disables interaction and announces progress while loading', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button loading onClick={onClick}>保存</Button>)

    const button = screen.getByRole('button', { name: '正在处理' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Field', () => {
  it('connects its label and accessible error message to the input', () => {
    render(<Field label="邮箱" error="请输入有效邮箱" />)

    const input = screen.getByRole('textbox', { name: '邮箱' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('请输入有效邮箱')
  })
})

describe('Dialog', () => {
  it('is labelled, receives focus and closes with Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Dialog open title="编辑计划" onClose={onClose}>内容</Dialog>)

    expect(screen.getByRole('dialog', { name: '编辑计划' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '关闭' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
