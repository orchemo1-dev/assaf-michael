'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Contact } from '@/lib/types'
import { Plus, X, BrandWhatsapp, Phone, Mail, Search } from 'tabler-icons-react'

const CATEGORIES = ['הכל', 'פרומוטר – פסטיבלים', 'מועדון', 'אירועי חברה', 'לייבל', 'אולפן', 'מדיה', 'אחר']

const EMPTY_FORM = { name: '', role: '', company: '', category: 'מועדון', phone: '', email: '', notes: '' }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filter, setFilter] = useState('הכל')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('contacts').select('*').order('name')
    setContacts(data ?? [])
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contacts').insert({ ...form, created_by: user?.id })
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY_FORM })
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  const waLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '').replace(/^0/, '972')
    return `https://wa.me/${cleaned}`
  }

  const filtered = contacts.filter(c => {
    const matchesCat = filter === 'הכל' || c.category === filter
    const q = search.toLowerCase()
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.role ?? '').toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">אנשי קשר</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: '#e24b4a' }}
        >
          <Plus size={16} />
          הוסף איש קשר
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
              style={{
                background: filter === cat ? '#111' : 'white',
                color: filter === cat ? 'white' : '#555',
                borderColor: filter === cat ? '#111' : '#e5e5e0',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search size={15} className="absolute top-2.5 right-3" style={{ color: '#aaa' }} />
          <input
            className="w-full pr-9 pl-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e5e5e0' }}
            placeholder="חיפוש..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid #e5e5e0', background: 'white' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #e5e5e0', background: '#fafaf8' }}>
              {['שם', 'תפקיד / מקום', 'קטגוריה', 'טלפון', 'מייל', 'פעולות'].map(h => (
                <th key={h} className="px-4 py-3 text-right font-semibold text-xs" style={{ color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#666' }}>
                  {[c.role, c.company].filter(Boolean).join(' · ')}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f7f7f5', color: '#666' }}>
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#666', direction: 'ltr', textAlign: 'right' }}>{c.phone || '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#666' }}>{c.email || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.phone && (
                      <>
                        <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer" title="וואטסאפ"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ background: '#dcfce7', color: '#16a34a' }}>
                          <BrandWhatsapp size={14} />
                        </a>
                        <a href={`tel:${c.phone}`} title="חייג"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                          style={{ background: '#dbeafe', color: '#2563eb' }}>
                          <Phone size={14} />
                        </a>
                      </>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} title="מייל"
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                        style={{ background: '#fef9c3', color: '#ca8a04' }}>
                        <Mail size={14} />
                      </a>
                    )}
                    <button onClick={() => handleDelete(c.id)} title="מחק"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ background: '#fde8e8', color: '#e24b4a' }}>
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center" style={{ color: '#aaa' }}>אין אנשי קשר</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add contact modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">הוספת איש קשר</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'שם מלא *', key: 'name' },
                { label: 'תפקיד', key: 'role' },
                { label: 'חברה / מקום', key: 'company' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#444' }}>{f.label}</label>
                  <input
                    className={inp}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(fr => ({ ...fr, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>קטגוריה</label>
                <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'הכל').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {[
                { label: 'טלפון', key: 'phone', ltr: true },
                { label: 'מייל', key: 'email', ltr: true },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#444' }}>{f.label}</label>
                  <input
                    className={inp}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(fr => ({ ...fr, [f.key]: e.target.value }))}
                    style={f.ltr ? { direction: 'ltr', textAlign: 'left' } : {}}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: '#444' }}>הערות</label>
                <textarea className={inp} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60" style={{ background: '#e24b4a' }}>
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
