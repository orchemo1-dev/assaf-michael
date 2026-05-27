'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/lib/types'
import { Plus, X, GripVertical } from 'tabler-icons-react'

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

const EMPTY_FORM = { title: '', category: 'מוזיקה', description: '', status: 'open' as TaskStatus, due_date: '' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const supabase = createClient()

  const loadTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }

  useEffect(() => { loadTasks() }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({
      ...form,
      due_date: form.due_date || null,
      created_by: user?.id,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY_FORM })
    loadTasks()
  }

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    loadTasks()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (dragging) {
      await handleStatusChange(dragging, status)
      setDragging(null)
    }
  }

  const filtered = filter ? tasks.filter(t => t.category === filter) : tasks

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">משימות</h2>
        <button
          onClick={() => setShowForm(true)}
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
          style={{
            background: !filter ? '#111' : 'white',
            color: !filter ? 'white' : '#555',
            borderColor: !filter ? '#111' : '#e5e5e0',
          }}
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
            <div
              key={status}
              className="flex flex-col gap-3"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: '#444' }}>{label}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: '#f0f0ee', color: '#888' }}
                >
                  {col.length}
                </span>
              </div>
              <div
                className="flex flex-col gap-2 min-h-[120px] rounded-xl p-2"
                style={{ background: '#f7f7f5', border: '0.5px solid #e5e5e0' }}
              >
                {col.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => setDragging(null)}
                    className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                    style={{
                      background: 'white',
                      border: '0.5px solid #e5e5e0',
                      opacity: dragging === task.id ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium leading-snug">{task.title}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <GripVertical size={14} style={{ color: '#ccc' }} />
                        <button onClick={() => handleDelete(task.id)} className="hover:text-red-500" style={{ color: '#ccc' }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: CAT_COLORS[task.category]?.bg ?? '#f0f0ee', color: CAT_COLORS[task.category]?.text ?? '#555' }}
                      >
                        {task.category}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px]" style={{ color: '#aaa' }}>{task.due_date}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#888' }}>{task.description}</p>
                    )}
                    {/* Status buttons */}
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
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add task modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">משימה חדשה</h3>
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
