'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/lib/types'
import { Plus, X, GripVertical, Pencil, Square, SquareCheck } from 'tabler-icons-react'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'open',        label: 'פתוח' },
  { status: 'in_progress', label: 'בתהליך' },
  { status: 'done',        label: 'הושלם' },
]

const CATEGORIES = ['מוזיקה', 'מרקטינג', 'הופעות', 'צילום', 'פגישות', 'לייבלים']

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  'מוזיקה':  { bg: '#fde8e8', text: '#9b1c1c' },
  'מרקטינג': { bg: '#dbeafe', text: '#1e3a8a' },
  'הופעות':  { bg: '#dcfce7', text: '#14532d' },
  'צילום':   { bg: '#ede9fe', text: '#4c1d95' },
  'פגישות':  { bg: '#fef9c3', text: '#713f12' },
  'לייבלים': { bg: '#f1f5f9', text: '#334155' },
}

const CHECKLIST_SEP = '\n---CHECKLIST---\n'

function parseDesc(raw: string) {
  const idx = raw.indexOf(CHECKLIST_SEP)
  if (idx === -1) return { text: raw, items: [] as string[] }
  return { text: raw.slice(0, idx), items: raw.slice(idx + CHECKLIST_SEP.length).split('\n').filter(Boolean) }
}

function buildDesc(text: string, items: string[]) {
  if (!items.length) return text
  return text + CHECKLIST_SEP + items.join('\n')
}

const EMPTY_FORM = { title: '', category: 'מוזיקה', description: '', status: 'open' as TaskStatus, due_date: '' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const loadTasks = async () => {
    const sb = createClient()
    const { data } = await sb.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }

  useEffect(() => { loadTasks() }, [])

  const openAdd = () => {
    setEditTask(null)
    setForm({ ...EMPTY_FORM })
    setChecklistItems([])
    setNewCheckItem('')
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    const { text, items } = parseDesc(task.description ?? '')
    setForm({ title: task.title, category: task.category, description: text, status: task.status, due_date: task.due_date ?? '' })
    setChecklistItems(items)
    setNewCheckItem('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const sb = createClient()
    const fullDesc = buildDesc(form.description, checklistItems)
    if (editTask) {
      await sb.from('tasks').update({
        title: form.title, category: form.category, description: fullDesc,
        status: form.status, due_date: form.due_date || null,
      }).eq('id', editTask.id)
    } else {
      const { data: { user } } = await sb.auth.getUser()
      await sb.from('tasks').insert({ ...form, description: fullDesc, due_date: form.due_date || null, created_by: user?.id })
    }
    setSaving(false)
    setShowForm(false)
    loadTasks()
  }

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    const sb = createClient()
    await sb.from('tasks').update({ status: newStatus }).eq('id', id)
    loadTasks()
  }

  const handleDelete = async (id: string) => {
    const sb = createClient()
    await sb.from('tasks').delete().eq('id', id)
    loadTasks()
  }

  const toggleCheckItem = async (task: Task, idx: number) => {
    const { text, items } = parseDesc(task.description ?? '')
    const it = items[idx]
    const toggled = it.startsWith('[x]') ? it.replace('[x]', '[ ]') : it.replace('[ ]', '[x]')
    const newItems = items.map((item, i) => i === idx ? toggled : item)
    const sb = createClient()
    await sb.from('tasks').update({ description: buildDesc(text, newItems) }).eq('id', task.id)
    loadTasks()
  }

  const addCheckItem = () => {
    const trimmed = newCheckItem.trim()
    if (!trimmed) return
    setChecklistItems(prev => [...prev, `[ ] ${trimmed}`])
    setNewCheckItem('')
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (dragging) { await handleStatusChange(dragging, status); setDragging(null) }
  }

  const filtered = filter ? tasks.filter(t => t.category === filter) : tasks

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">משימות</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: '#e24b4a' }}
        >
          <Plus size={16} />
          משימה חדשה
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
          style={{ background: !filter ? '#111' : 'white', color: !filter ? 'white' : '#555', borderColor: !filter ? '#111' : '#e5e5e0' }}
        >
          הכל
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? null : cat)}
            className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
            style={{
              background: filter === cat ? CAT_COLORS[cat]?.bg : 'white',
              color: filter === cat ? CAT_COLORS[cat]?.text : '#555',
              borderColor: filter === cat ? CAT_COLORS[cat]?.bg : '#e5e5e0',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(({ status, label }) => {
          const col = filtered.filter(t => t.status === status)
          return (
            <div key={status} className="flex flex-col gap-3" onDragOver={handleDragOver} onDrop={e => handleDrop(e, status)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: '#444' }}>{label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#f0f0ee', color: '#888' }}>{col.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[120px] rounded-xl p-2" style={{ background: '#f7f7f5', border: '0.5px solid #e5e5e0' }}>
                {col.map(task => {
                  const { text, items } = parseDesc(task.description ?? '')
                  const doneCount = items.filter(it => it.startsWith('[x]')).length
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragging(task.id)}
                      onDragEnd={() => setDragging(null)}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                      style={{ background: 'white', border: '0.5px solid #e5e5e0', opacity: dragging === task.id ? 0.5 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <GripVertical size={14} style={{ color: '#ccc' }} />
                          <button onClick={() => openEdit(task)} style={{ color: '#ccc' }} className="hover:text-blue-400">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(task.id)} className="hover:text-red-500" style={{ color: '#ccc' }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: CAT_COLORS[task.category]?.bg ?? '#f0f0ee', color: CAT_COLORS[task.category]?.text ?? '#555' }}>
                          {task.category}
                        </span>
                        {task.due_date && <span className="text-[10px]" style={{ color: '#aaa' }}>{task.due_date}</span>}
                      </div>
                      {text && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#888' }}>{text}</p>}
                      {items.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {items.map((it, idx) => {
                            const done = it.startsWith('[x]')
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleCheckItem(task, idx)}
                                className="flex items-center gap-1.5 text-xs w-full text-right"
                                style={{ color: done ? '#aaa' : '#444' }}
                              >
                                <span className="shrink-0" style={{ color: done ? '#52a918' : '#ccc' }}>
                                  {done ? <SquareCheck size={13} /> : <Square size={13} />}
                                </span>
                                <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{it.slice(4)}</span>
                              </button>
                            )
                          })}
                          <p className="text-[10px] mt-0.5" style={{ color: '#bbb' }}>{doneCount}/{items.length}</p>
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        {COLUMNS.filter(c => c.status !== status).map(c => (
                          <button
                            key={c.status}
                            onClick={() => handleStatusChange(task.id, c.status)}
                            className="text-[10px] px-1.5 py-0.5 rounded border"
                            style={{ borderColor: '#e5e5e0', color: '#888' }}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit task modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editTask ? 'עריכת משימה' : 'משימה חדשה'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>כותרת</label>
                <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>קטגוריה</label>
                <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>תיאור</label>
                <textarea className={inp} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: '#444' }}>צ'קליסט</label>
                {checklistItems.map((it, i) => {
                  const done = it.startsWith('[x]')
                  const itemLabel = it.slice(4)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChecklistItems(prev => prev.map((item, idx) =>
                          idx === i ? (done ? `[ ] ${itemLabel}` : `[x] ${itemLabel}`) : item
                        ))}
                        style={{ color: done ? '#52a918' : '#ccc', flexShrink: 0 }}
                      >
                        {done ? <SquareCheck size={16} /> : <Square size={16} />}
                      </button>
                      <span className="text-sm flex-1" style={{ color: done ? '#aaa' : '#333', textDecoration: done ? 'line-through' : 'none' }}>{itemLabel}</span>
                      <button type="button" onClick={() => setChecklistItems(prev => prev.filter((_, idx) => idx !== i))} style={{ color: '#ccc' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
                <div className="flex gap-2">
                  <input
                    className={inp}
                    placeholder="הוסף פריט לרשימה..."
                    value={newCheckItem}
                    onChange={e => setNewCheckItem(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                  />
                  <button
                    type="button"
                    onClick={addCheckItem}
                    className="px-3 py-2 rounded-lg text-white text-sm font-medium shrink-0"
                    style={{ background: '#e24b4a' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#444' }}>סטטוס</label>
                  <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                    {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#444' }}>תאריך יעד</label>
                  <input type="date" className={inp} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={{ direction: 'ltr' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
                  style={{ background: '#e24b4a' }}
                >
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#e5e5e0', color: '#666' }}>ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-[#e24b4a]'
