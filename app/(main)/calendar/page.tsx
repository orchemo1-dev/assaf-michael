'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event, EventType, PaymentStatus } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Music,
  Microphone,
  Users,
  Camera,
} from 'tabler-icons-react'

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const DAYS_HE = ['א','ב','ג','ד','ה','ו','ש']

const EVENT_COLORS: Record<EventType, string> = {
  gig:     '#e24b4a',
  studio:  '#639922',
  meeting: '#534ab7',
  other:   '#ba7517',
}

const EVENT_LABELS: Record<EventType, string> = {
  gig:     'הופעה',
  studio:  'אולפן',
  meeting: 'פגישה',
  other:   'אחר',
}

const EVENT_ICONS: Record<EventType, React.ElementType> = {
  gig:     Microphone,
  studio:  Music,
  meeting: Users,
  other:   Camera,
}

const EMPTY_FORM = {
  type: 'gig' as EventType,
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  price: '',
  advance_paid: '',
  advance_received: false,
  contact_name: '',
  contact_phone: '',
  lineup: '',
  equipment: '',
  payment_status: 'unpaid' as PaymentStatus,
  location: '',
  rating: 5,
  notes: '',
  attendees: '',
  meeting_topic: '',
  meeting_goals: '',
}

export default function CalendarPage() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const loadEvents = async () => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('date', start)
      .lte('date', end)
    setEvents(data ?? [])
  }

  useEffect(() => { loadEvents() }, [year, month])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Build calendar grid (RTL: Sunday = col 0)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload: Partial<Event> = {
      type: form.type,
      title: form.title,
      date: form.date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      notes: form.notes || undefined,
      created_by: user?.id,
    }
    if (form.type === 'gig') {
      Object.assign(payload, {
        price: form.price ? Number(form.price) : 0,
        advance_paid: form.advance_paid ? Number(form.advance_paid) : 0,
        advance_received: form.advance_received,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        lineup: form.lineup,
        equipment: form.equipment,
        payment_status: form.payment_status,
        location: form.location,
        rating: form.rating,
      })
    }
    if (form.type === 'meeting') {
      Object.assign(payload, {
        attendees: form.attendees,
        meeting_topic: form.meeting_topic,
        meeting_goals: form.meeting_goals,
      })
    }
    await supabase.from('events').insert(payload)
    setSaving(false)
    setShowForm(false)
    setForm({ ...EMPTY_FORM })
    loadEvents()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setSelected(null)
    loadEvents()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
          <h2 className="text-xl font-bold min-w-[160px] text-center">
            {MONTHS_HE[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()) }}
            className="px-3 py-1 rounded-lg border text-sm"
            style={{ borderColor: '#e5e5e0', color: '#666' }}
          >
            היום
          </button>
        </div>
        <button
          onClick={() => { setForm({ ...EMPTY_FORM, date: `${year}-${String(month + 1).padStart(2, '0')}-01` }); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: '#e24b4a' }}
        >
          <Plus size={16} />
          הוסף אירוע
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-sm" style={{ color: '#666' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: EVENT_COLORS[type] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '0.5px solid #e5e5e0', background: 'white' }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: '#e5e5e0' }}>
          {DAYS_HE.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold" style={{ color: '#888' }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < cells.length / 7 - 1 ? '0.5px solid #e5e5e0' : 'none' }}>
            {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
              const isToday = day !== null && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
              const dayEvents = day ? getEventsForDay(day) : []
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              return (
                <div
                  key={ci}
                  className="min-h-[60px] md:min-h-[100px] p-1 md:p-1.5 cursor-pointer group"
                  style={{ borderRight: ci < 6 ? '0.5px solid #e5e5e0' : 'none', background: day ? 'white' : '#fafaf8' }}
                  onClick={() => {
                    if (!day) return
                    setForm({ ...EMPTY_FORM, date: dateStr })
                    setShowForm(true)
                  }}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-0.5">
                        <div
                          className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium"
                          style={{
                            background: isToday ? '#e24b4a' : 'transparent',
                            color: isToday ? 'white' : '#333',
                          }}
                        >
                          {day}
                        </div>
                        <span className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px]" style={{ background: '#e24b4a' }}>+</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dayEvents.map(ev => {
                          const Icon = EVENT_ICONS[ev.type as EventType]
                          return (
                            <button
                              key={ev.id}
                              onClick={e => { e.stopPropagation(); setSelected(ev) }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] font-medium w-full text-right truncate"
                              style={{ background: EVENT_COLORS[ev.type as EventType] }}
                            >
                              <Icon size={10} />
                              <span className="truncate">{ev.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Event detail modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs font-medium mb-2"
                style={{ background: EVENT_COLORS[selected.type as EventType] }}
              >
                {EVENT_LABELS[selected.type as EventType]}
              </div>
              <h3 className="text-lg font-bold">{selected.title}</h3>
              <p className="text-sm" style={{ color: '#888' }}>{selected.date}{selected.start_time ? ` | ${selected.start_time}–${selected.end_time}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(selected.id)}
                className="text-xs px-2 py-1 rounded border"
                style={{ color: '#e24b4a', borderColor: '#fde8e8' }}
              >
                מחק
              </button>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            {selected.type === 'gig' && (
              <>
                <Row label="מחיר" value={selected.price ? `₪${selected.price.toLocaleString()}` : '—'} />
                <Row label="מקדמה" value={selected.advance_paid ? `₪${selected.advance_paid.toLocaleString()}` : '—'} />
                <Row label="יתרה לתשלום" value={selected.price && selected.advance_paid ? `₪${(selected.price - selected.advance_paid).toLocaleString()}` : '—'} />
                <Row label="מקדמה התקבלה" value={selected.advance_received ? 'כן' : 'לא'} />
                {selected.payment_status && <div className="flex justify-between"><span style={{ color: '#888' }}>סטטוס תשלום</span><StatusBadge status={selected.payment_status} /></div>}
                <Row label="איש קשר" value={selected.contact_name ? `${selected.contact_name}${selected.contact_phone ? ` | ${selected.contact_phone}` : ''}` : '—'} />
                <Row label="ליינאפ" value={selected.lineup || '—'} />
                <Row label="ציוד" value={selected.equipment || '—'} />
                <Row label="מיקום" value={selected.location || '—'} />
              </>
            )}
            {selected.type === 'meeting' && (
              <>
                <Row label="משתתפים" value={selected.attendees || '—'} />
                <Row label="נושא" value={selected.meeting_topic || '—'} />
                {selected.meeting_goals && (
                  <div>
                    <p className="font-medium mb-1">יעדים / סיכום</p>
                    <p className="p-2 rounded-lg text-sm" style={{ background: '#fafaf8', color: '#555' }}>{selected.meeting_goals}</p>
                  </div>
                )}
              </>
            )}
            {selected.notes && (
              <div>
                <p className="font-medium mb-1">הערות</p>
                <p className="p-2 rounded-lg text-sm" style={{ background: '#fafaf8', color: '#555' }}>{selected.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add event form modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} wide>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">הוספת אירוע חדש</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
          </div>

          <div className="grid gap-4">
            {/* Type */}
            <div className="flex gap-2">
              {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    background: form.type === t ? EVENT_COLORS[t] : 'white',
                    color: form.type === t ? 'white' : '#555',
                    borderColor: form.type === t ? EVENT_COLORS[t] : '#e5e5e0',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <FormRow label="כותרת">
              <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </FormRow>
            <FormRow label="תאריך">
              <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={{ direction: 'ltr' }} />
            </FormRow>
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="שעת התחלה">
                <input type="time" className={inputCls} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={{ direction: 'ltr' }} />
              </FormRow>
              <FormRow label="שעת סיום">
                <input type="time" className={inputCls} value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={{ direction: 'ltr' }} />
              </FormRow>
            </div>

            {form.type === 'gig' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="מחיר (₪)">
                    <input type="number" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </FormRow>
                  <FormRow label="מקדמה (₪)">
                    <input type="number" className={inputCls} value={form.advance_paid} onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))} />
                  </FormRow>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="adv" checked={form.advance_received} onChange={e => setForm(f => ({ ...f, advance_received: e.target.checked }))} />
                  <label htmlFor="adv" className="text-sm">מקדמה התקבלה</label>
                </div>
                <FormRow label="סטטוס תשלום">
                  <select className={inputCls} value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as PaymentStatus }))}>
                    <option value="closing">בתהליך סגירה</option>
                    <option value="unpaid">לא שולם</option>
                    <option value="advance">מקדמה עברה</option>
                    <option value="done">הכל בוצע</option>
                  </select>
                </FormRow>
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="שם איש קשר">
                    <input className={inputCls} value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                  </FormRow>
                  <FormRow label="טלפון">
                    <input className={inputCls} value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} style={{ direction: 'ltr' }} />
                  </FormRow>
                </div>
                <FormRow label="ליינאפ">
                  <input className={inputCls} value={form.lineup} onChange={e => setForm(f => ({ ...f, lineup: e.target.value }))} />
                </FormRow>
                <FormRow label="ציוד במקום">
                  <input className={inputCls} value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
                </FormRow>
                <FormRow label="מיקום / ונייה">
                  <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </FormRow>
              </>
            )}

            {form.type === 'meeting' && (
              <>
                <FormRow label="משתתפים">
                  <input className={inputCls} value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} />
                </FormRow>
                <FormRow label="נושא הפגישה">
                  <input className={inputCls} value={form.meeting_topic} onChange={e => setForm(f => ({ ...f, meeting_topic: e.target.value }))} />
                </FormRow>
                <FormRow label="סיכום / יעדים">
                  <textarea className={inputCls} rows={3} value={form.meeting_goals} onChange={e => setForm(f => ({ ...f, meeting_goals: e.target.value }))} />
                </FormRow>
              </>
            )}

            <FormRow label="הערות">
              <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </FormRow>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.date}
                className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-60"
                style={{ background: '#e24b4a' }}
              >
                {saving ? 'שומר...' : 'שמור אירוע'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: '#e5e5e0', color: '#666' }}
              >
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: '#888' }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: '#444' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-[#e24b4a]'

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div
        className={`w-full rounded-2xl p-6 overflow-y-auto max-h-[90vh] ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ background: 'white', border: '0.5px solid #e5e5e0' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
