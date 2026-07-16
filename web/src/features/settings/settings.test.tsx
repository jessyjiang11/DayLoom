import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Profile } from '../../types/domain'
import { SettingsForm } from './SettingsPage'

const profile = { user_id: '0f3b47e4-7748-4291-88d1-b29b53c98162', display_name: '小禾', avatar_url: null, timezone: 'Asia/Shanghai', week_starts_on: 1, preferences: {}, onboarding_mode: 'blank', created_at: '2026-07-16T00:00:00Z', updated_at: '2026-07-16T00:00:00Z' } as Profile
describe('SettingsForm', () => { it('saves the selected default home page', async () => { const onSave = vi.fn().mockResolvedValue(undefined); render(<SettingsForm profile={profile} onSave={onSave} />); await userEvent.click(screen.getByLabelText(/计划/)); await userEvent.click(screen.getByRole('button', { name: '保存设置' })); expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ homePage: 'planner' })); expect(await screen.findByText('设置已保存')).toBeInTheDocument() }) })
