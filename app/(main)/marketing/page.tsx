'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { MarketingItem } from '@/lib/types'
import {
  Plus, X, Link, Bulb, Photo,
  Bookmark, ExternalLink, Star, Pencil,
} from 'tabler-icons-react'

const TYPES = [
  { value: 'all',        label: 'הכל' },
  { value: 'reference',  label: 'רפרנסים' },
  { value: 'idea',       label: 'רעיונות' },
  { value: 'link',       label: 'קישורים' },
  { value: 'photo',      label: 'תמונות' },
  { value: 'my_content', label: 'תוכן שלי' },
]

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  reference:  { icon: Bookmark,  color: '#534ab7', bg: '#eeedfe' },
  idea:       { icon: Bulb,      color: '#ba7517', bg: '#fef3c7' },
  link:       { icon: Link,      color: '#0284c7', bg: '#e0f2fe' },
  photo:      { icon: Photo,     color: '#639922', bg: '#f0fdf4' },
  my_content: { icon: Star,      color: '#e24b4a', bg: '#fde8e8' },
}

const EMPTY_FORM = { type: 'reference', title: '', description: '', url: '' }

export default function MarketingPage() {
  const [items, setItems] = useState<MarketingItem[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MarketingItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('marketing').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  const openEdit = (item: MarketingItem) => {
    setEditItem(item)
    setForm({ type: item.type, title: item.title, description: item.description ?? '', url: item.url ?? '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const sb = createClient()
    if (editItem) {
      await sb.from('marketing').update({ type: form.type, title: form.title, description: form.description, url: form.url }).eq('id', editItem.id)
    } else {
      const { data: { user } } = await sb.auth.getUser()
      await sb.from('marketing').insert({ ...form, created_by: user?.id })
    }
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const handleDelete = async (id: string) => {
    const sb = createClient()
    await sb.from('marketing').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">מרקטינג</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: '#e24b4a' }}
        >
          <Plus size={16} />
          הוסף פריט
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
            style={{
              background: filter === t.value ? '#111' : 'white',
              color: filter === t.value ? 'white' : '#555',
              borderColor: filter === t.value ? '#111' : '#e5e5e0',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => {
          const meta = TYPE_META[item.type] ?? TYPE_META.reference
          const Icon = meta.icon
          return (
            <div
              key={item.id}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'white', border: '0.5px solid #e5e5e0' }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon size={16} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-1 hover:bg-gray-100 rounded" style={{ color: '#ccc' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-gray-100 rounded" style={{ color: '#ccc' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm leading-snug">{item.title}</p>
                {item.description && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#888' }}>{item.description}</p>
                )}
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs mt-auto"
                  style={{ color: '#0284c7' }}
                >
                  <ExternalLink size={12} />
                  פתח קישור
                </a>
              )}

              <p className="text-[10px]" style={{ color: '#bbb' }}>
                {new Date(item.created_at ?? '').toLocaleDateString('he-IL')}
              </p>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16" style={{ color: '#aaa' }}>
            אין פריטים עדיין
          </div>
        )}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editItem ? 'עריכת פריט' : 'הוספת פריט מרקטינג'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>סוג</label>
                <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>כותרת</label>
                <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>תיאור</label>
                <textarea className={inp} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>קישור URL</label>
                <input className={inp} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} style={{ direction: 'ltr' }} placeholder="https://" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.title} className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60" style={{ background: '#e24b4a' }}>
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
