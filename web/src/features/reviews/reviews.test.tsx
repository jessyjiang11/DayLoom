import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewEditor } from './ReviewPage'

describe('ReviewEditor', () => {
  it('collects reflection fields and saves them', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ReviewEditor onSave={onSave} />)
    await userEvent.type(screen.getByLabelText('这一阶段最重要的一句话'), '做少一点，完成更多')
    await userEvent.type(screen.getByLabelText('发生了什么'), '完成了第一版')
    await userEvent.type(screen.getByLabelText('做得好的'), '每天都有一点进展')
    await userEvent.type(screen.getByLabelText('遇到的阻碍'), '任务拆得不够小')
    await userEvent.type(screen.getByLabelText('下一步'), '先完成今日页面')
    await userEvent.click(screen.getByRole('button', { name: '保存复盘' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ focus_text: '做少一点，完成更多', summary: '完成了第一版', next_step: '先完成今日页面' }))
    expect(await screen.findByText('已经保存到云端')).toBeInTheDocument()
  })

  it('disables editing while offline', () => {
    render(<ReviewEditor readOnly onSave={vi.fn()} />)
    expect(screen.getByLabelText('发生了什么')).toBeDisabled()
    expect(screen.getByRole('button', { name: '保存复盘' })).toBeDisabled()
  })
})
