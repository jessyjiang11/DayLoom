import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../auth/useAuth'
import { useSync } from '../sync/useSync'
import { archiveItem, beginOptimisticItemUpdate, createItem, itemKeys, listItemsOnlineFirst, updateItem, type ItemCreateInput } from '../../repositories/itemRepository'
import type { PlanItem } from '../../types/domain'
import { ItemEditor } from '../items/ItemEditor'
import { GoalDetail } from './GoalDetail'
import { GoalTree } from './GoalTree'
import './goals.css'

export function GoalsPage() {
  const { client, user } = useAuth(); const sync = useSync(); const queryClient = useQueryClient()
  const [selected, setSelected] = useState<PlanItem | null>(null); const [editor, setEditor] = useState<{ item?: PlanItem; parentId?: string | null } | null>(null)
  const query = useQuery({ queryKey: itemKeys.list(user?.id ?? ''), enabled: Boolean(client && user), queryFn: async () => { const result = await listItemsOnlineFirst(client!, user!.id); if (result.source === 'cache') sync.reportNetworkError(); else sync.reportNetworkSuccess(); return result.items } })
  const items = query.data ?? []
  async function save(value: ItemCreateInput & { parent_id?: string | null }) {
    if (!client || !user) return
    let rollback: (() => void) | undefined
    try {
      if (editor?.item) {
        rollback = beginOptimisticItemUpdate(queryClient, user.id, editor.item.id, value)
        await updateItem(client, user.id, editor.item.id, value)
      } else await createItem(client, user.id, value)
      await queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) })
    } catch (error) { rollback?.(); throw error }
  }
  async function remove() { if (!client || !user || !selected || !window.confirm(`删除“${selected.title}”及其子计划？`)) return; await archiveItem(client, user.id, selected.id); setSelected(null); await queryClient.invalidateQueries({ queryKey: itemKeys.list(user.id) }) }
  return <div className="goals-page"><header className="section-heading"><div><p>目标</p><h1>目标不是梯子，是方向。</h1><span>把想做的事情放进一棵能随时调整的树。</span></div><Button disabled={sync.readOnly} onClick={() => setEditor({ parentId: null })}>＋ 添加目标</Button></header>
    {query.isLoading ? <p role="status">正在读取目标…</p> : query.isError ? <p role="alert">暂时无法读取目标。</p> : <div className="goals-layout"><section className="goal-tree-panel"><div className="panel-label">目标树 <span>{items.length}</span></div>{items.length ? <GoalTree items={items} selectedId={selected?.id} onSelect={setSelected} onAddChild={(item) => setEditor({ parentId: item.id })} /> : <button className="empty-add" onClick={() => setEditor({ parentId: null })}>写下第一个目标</button>}</section><GoalDetail item={selected} childCount={items.filter((item) => item.parent_id === selected?.id).length} onEdit={() => selected && setEditor({ item: selected })} onDelete={() => void remove()} /></div>}
    <ItemEditor open={Boolean(editor)} item={editor?.item} parentId={editor?.parentId} onClose={() => setEditor(null)} onSave={save} />
  </div>
}
