import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { getHomePage, getProfile, updateProfileSettings, type ProfileSettingsInput } from '../../repositories/profileRepository'
import type { Profile } from '../../types/domain'
import { useAuth } from '../auth/useAuth'
import './settings.css'

export function SettingsForm({ profile, onSave }: { profile: Profile; onSave: (input: ProfileSettingsInput) => Promise<void> }) {
  const [displayName, setDisplayName] = useState(profile.display_name); const [timezone, setTimezone] = useState(profile.timezone); const [weekStartsOn, setWeekStartsOn] = useState(profile.week_starts_on); const [homePage, setHomePage] = useState(getHomePage(profile)); const [saving, setSaving] = useState(false); const [message, setMessage] = useState<string | null>(null)
  useEffect(() => { setDisplayName(profile.display_name); setTimezone(profile.timezone); setWeekStartsOn(profile.week_starts_on); setHomePage(getHomePage(profile)) }, [profile])
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(null); try { await onSave({ displayName, timezone, weekStartsOn, homePage }); setMessage('设置已保存') } catch { setMessage('保存失败，请稍后重试') } finally { setSaving(false) } }
  return <form className="settings-form" onSubmit={submit}><section className="settings-section"><div><p>01</p><h2>账户资料</h2><span>在应用里怎样称呼你。</span></div><div><Field label="显示名称" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /><Field label="所在时区" value={timezone} onChange={(event) => setTimezone(event.target.value)} /></div></section><section className="settings-section"><div><p>02</p><h2>时间习惯</h2><span>影响周计划边界和日期显示。</span></div><div><label className="ui-field"><span className="ui-field__label">每周从哪天开始</span><select aria-label="每周从哪天开始" className="ui-field__control" value={weekStartsOn} onChange={(event) => setWeekStartsOn(Number(event.target.value))}><option value={1}>周一</option><option value={0}>周日</option><option value={6}>周六</option></select></label></div></section><section className="settings-section"><div><p>03</p><h2>默认首页</h2><span>登录后首先想看到什么。</span></div><fieldset className="home-options"><legend className="sr-only">默认首页</legend>{[{ value: 'today', title: '今日', note: '重点、时间轴和收集箱' }, { value: 'goals', title: '目标', note: '先看长期方向与目标树' }, { value: 'planner', title: '计划', note: '直接进入月周日排期' }, { value: 'reviews', title: '复盘', note: '先看记录与成长' }].map((option) => <label className={homePage === option.value ? 'is-selected' : ''} key={option.value}><input type="radio" name="home-page" value={option.value} checked={homePage === option.value} onChange={() => setHomePage(option.value as ProfileSettingsInput['homePage'])} /><span><strong>{option.title}</strong><small>{option.note}</small></span></label>)}</fieldset></section><footer className="settings-save">{message && <p role="status">{message}</p>}<Button type="submit" loading={saving}>保存设置</Button></footer></form>
}

export function SettingsPage() {
  const { client, user, signOut } = useAuth(); const queryClient = useQueryClient(); const query = useQuery({ queryKey: ['profile', user?.id], enabled: Boolean(client && user), queryFn: () => getProfile(client!, user!.id) })
  async function save(input: ProfileSettingsInput) { if (!client || !user || !query.data) return; const profile = await updateProfileSettings(client, user.id, query.data, input); queryClient.setQueryData(['profile', user.id], profile) }
  function exportData() { if (!query.data) return; const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profile: query.data }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `dayloom-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url) }
  if (query.isLoading) return <p role="status">正在读取设置…</p>
  if (!query.data) return <p role="alert">暂时无法读取账户设置。</p>
  return <div className="settings-page"><header className="section-heading"><div><p>设置</p><h1>让这里更像你。</h1><span>这些选择会跟随你的账户同步。</span></div></header><SettingsForm profile={query.data} onSave={save} /><section className="settings-data"><div><h2>数据与账户</h2><p>先提供 JSON 备份；完整任务导出会在部署验收时补齐。</p></div><div><Button variant="secondary" onClick={exportData}>导出资料</Button><Button variant="quiet" onClick={() => void signOut()}>退出登录</Button></div></section></div>
}
