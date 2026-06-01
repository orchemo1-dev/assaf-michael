'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event, EventType, PaymentStatus } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import BottomSheet from '@/components/ui/BottomSheet'
import {
  ChevronRight, ChevronLeft, Plus, Pencil,
  Music, Microphone, Users, Camera,
} from 'tabler-icons-react'

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const DAYS_HE   = ['א','ב','ג','ד','ה','ו','ש']

const EVENT_COLORS: Record<EventType, string> = {
  gig: '#e24b4a', studio: '#639922', meeting: '#534ab7', other: '#ba7517',
}
const EVENT_LABELS: Record<EventType, string> = {
  gig: 'הופעה', studio: 'אולפן', meeting: 'פגישה', other: 'אחר',
}
const EVENT_ICONS: Record<EventType, React.ElementType> = {
  gig: Microphone, studio: Music, meeting: Users, other: Camera,
}

const EMPTY_FORM = {
  type: 'gig' as EventType,
  title: '', date: '', end_date: '', start_time: '', end_time: '',
  price: '', advance_paid: '',
  advance_received: false,
  contact_name: '', contact_phone: '', lineup: '', equipment: '',
  payment_status: 'closing' as PaymentStatus,
  location: '', rating: 5, notes: '',
  attendees: '', meeting_topic: '', meeting_goals: '',
}

interface UserInfo { id: string; email: string; name: string }

export default function CalendarPage() {
  const [year, setYear]   = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('cal_ym')
      if (s) return parseInt(s.split('-')[0])
    }
    return new Date().getFullYear()
  })
  const [month, setMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('cal_ym')
      if (s) return parseInt(s.split('-')[1])
    }
    return new Date().getMonth()
  })
  const [events, setEvents]   = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dayView, setDayView]   = useState<{ date: string; events: Event[] } | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {})
  }, [])

  // Persist month/year so navigating away and back keeps the same month
  useEffect(() => {
    localStorage.setItem('cal_ym', `${year}-${month}`)
  }, [year, month])

  useEffect(() => {
    const sb = createClient()
    const start   = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const end     = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    sb.from('events').select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date').order('start_time')
      .then(({ data, error }) => { if (!error) setEvents(data ?? []) })
  }, [year, month])

  const reload = () => {
    const sb = createClient()
    const start   = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const end     = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    sb.from('events').select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date').order('start_time')
      .then(({ data, error }) => { if (!error) setEvents(data ?? []) })
  }

  const prevMonth = () => {
    setYear(y => month === 0 ? y - 1 : y)
    setMonth(m => m === 0 ? 11 : m - 1)
  }
  const nextMonth = () => {
    setYear(y => month === 11 ? y + 1 : y)
    setMonth(m => m === 11 ? 0 : m + 1)
  }

  const goToDate = (dateStr: string) => {
    const [y, m] = dateStr.split('-').map(Number)
    setYear(y); setMonth(m - 1)
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const dayStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getEventsForDay = (day: number) => {
    const d = dayStr(day)
    return events.filter(e => {
      const endD = e.end_date ?? e.date
      return e.date <= d && endD >= d
    })
  }

  const handleDayClick = (day: number) => {
    const d = dayStr(day)
    const dayEvs = getEventsForDay(day)
    if (dayEvs.length > 0) {
      setDayView({ date: d, events: dayEvs })
    } else {
      setForm({ ...EMPTY_FORM, date: d })
      setEditingId(null)
      setShowForm(true)
    }
  }

  const openAdd = (date?: string) => {
    setDayView(null)
    setForm({ ...EMPTY_FORM, date: date ?? '' })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (ev: Event) => {
    setSelected(null)
    setDayView(null)
    setForm({
      type: ev.type as EventType,
      title: ev.title,
      date: ev.date,
      end_date: ev.end_date ?? '',
      start_time: ev.start_time ?? '',
      end_time: ev.end_time ?? '',
      price: ev.price != null ? String(ev.price) : '',
      advance_paid: ev.advance_paid != null ? String(ev.advance_paid) : '',
      advance_received: ev.advance_received ?? false,
      contact_name: ev.contact_name ?? '',
      contact_phone: ev.contact_phone ?? '',
      lineup: ev.lineup ?? '',
      equipment: ev.equipment ?? '',
      payment_status: (ev.payment_status ?? 'closing') as PaymentStatus,
      location: ev.location ?? '',
      rating: ev.rating ?? 5,
      notes: ev.notes ?? '',
      attendees: ev.attendees ?? '',
      meeting_topic: ev.meeting_topic ?? '',
      meeting_goals: ev.meeting_goals ?? '',
    })
    setEditingId(ev.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()

    const payload: Partial<Event> = {
      type: form.type,
      title: form.title,
      date: form.date,
      end_date: form.end_date && form.end_date > form.date ? form.end_date : undefined,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      notes: form.notes || undefined,
    }
    if (!editingId) payload.created_by = user?.id

    if (form.type === 'gig') Object.assign(payload, {
      price: form.price ? Number(form.price) : 0,
      advance_paid: form.advance_paid ? Number(form.advance_paid) : 0,
      advance_received: form.advance_received,
      contact_name: form.contact_name || undefined,
      contact_phone: form.contact_phone || undefined,
      lineup: form.lineup || undefined,
      equipment: form.equipment || undefined,
      payment_status: form.payment_status,
      location: form.location || undefined,
      rating: form.rating,
    })
    if (form.type === 'meeting') Object.assign(payload, {
      attendees: form.attendees || undefined,
      meeting_topic: form.meeting_topic || undefined,
      meeting_goals: form.meeting_goals || undefined,
    })

    if (editingId) {
      await sb.from('events').update(payload).eq('id', editingId)
    } else {
      await sb.from('events').insert(payload)

      // Auto-add contact if gig has a contact name
      if (form.type === 'gig' && form.contact_name.trim()) {
        const { data: existing } = await sb
          .from('contacts')
          .select('id')
          .ilike('name', form.contact_name.trim())
          .limit(1)
        if (!existing?.length) {
          await sb.from('contacts').insert({
            name: form.contact_name.trim(),
            phone: form.contact_phone || undefined,
            role: 'מפיק אירועים',
            category: 'אחר',
            created_by: user?.id,
          })
        }
      }
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })

    // Navigate to the saved event's month so it's always visible
    if (form.date) goToDate(form.date)
    else reload()
  }

  const handleDelete = async (id: string) => {
    const sb = createClient()
    await sb.from('events').delete().eq('id', id)
    setSelected(null)
    reload()
  }

  const getUserName = (id?: string) =>
    id ? (users.find(u => u.id === id)?.name ?? null) : null

  const formatDateHe = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
    return `יום ${dayNames[dt.getDay()]}, ${dt.getDate()} ב${MONTHS_HE[dt.getMonth()]}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"><ChevronRight size={18} /></button>
          <h2 className="text-lg font-bold min-w-[140px] text-center">{MONTHS_HE[month]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <button
            onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()) }}
            className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-gray-50"
            style={{ borderColor: '#e5e5e0', color: '#666' }}
          >היום</button>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80"
          style={{ background: '#e24b4a' }}
        >
          <Plus size={16} /> הוסף אירוע
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: '#888' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: EVENT_COLORS[type] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e5e5e0', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="grid grid-cols-7" style={{ borderBottom: '0.5px solid #e5e5e0', background: '#fafaf8' }}>
          {DAYS_HE.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold" style={{ color: '#999' }}>{d}</div>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: wi < cells.length / 7 - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
            {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
              const isToday = day !== null && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
              const dayEvs  = day ? getEventsForDay(day) : []
              return (
                <div
                  key={ci}
                  className="min-h-[76px] md:min-h-[100px] p-1 md:p-1.5"
                  style={{
                    borderRight: ci < 6 ? '0.5px solid #f0f0ee' : 'none',
                    background: day ? 'white' : '#fafaf8',
                    cursor: day ? 'pointer' : 'default',
                  }}
                  onClick={() => day && handleDayClick(day)}
                >
                  {day && (
                    <>
                      <div className="mb-1">
                        <span
                          className="w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-semibold"
                          style={{ background: isToday ? '#e24b4a' : 'transparent', color: isToday ? 'white' : '#333' }}
                        >{day}</span>
                      </div>
                      <div className="flex flex-col gap-[3px]">
                        {dayEvs.slice(0, 3).map(ev => (
                          <button
                            key={ev.id}
                            onClick={e => { e.stopPropagation(); setSelected(ev) }}
                            className="flex items-center gap-1 w-full text-left overflow-hidden hover:opacity-85 active:opacity-70"
                            style={{
                              background: EVENT_COLORS[ev.type as EventType],
                              borderRadius: '4px',
                              padding: '2px 4px',
                              minHeight: '16px',
                            }}
                          >
                            <span
                              className="text-white font-medium overflow-hidden"
                              style={{ fontSize: '10px', lineHeight: '12px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block', width: '100%' }}
                            >
                              {ev.title}
                            </span>
                          </button>
                        ))}
                        {dayEvs.length > 3 && (
                          <span style={{ fontSize: '9px', color: '#aaa', paddingRight: '2px' }}>+{dayEvs.length - 3}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Day view */}
      {dayView && (
        <BottomSheet onClose={() => setDayView(null)} title={formatDateHe(dayView.date)}>
          <div className="flex flex-col gap-3">
            {dayView.events.map(ev => {
              const Icon = EVENT_ICONS[ev.type as EventType]
              return (
                <button
                  key={ev.id}
                  onClick={() => { setDayView(null); setSelected(ev) }}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-right hover:opacity-90"
                  style={{ background: EVENT_COLORS[ev.type as EventType] + '15', border: `1px solid ${EVENT_COLORS[ev.type as EventType]}30` }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: EVENT_COLORS[ev.type as EventType] }}>
                    <Icon size={16} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{ev.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {EVENT_LABELS[ev.type as EventType]}
                      {ev.start_time ? ` · ${ev.start_time}` : ''}
                      {ev.end_date && ev.end_date !== ev.date ? ` · עד ${ev.end_date}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                  <ChevronLeft size={16} style={{ color: '#ccc', flexShrink: 0 }} />
                </button>
              )
            })}
            <button
              onClick={() => openAdd(dayView.date)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed hover:bg-gray-50"
              style={{ borderColor: '#e5e5e0', color: '#999' }}
            >
              <Plus size={15} /> הוסף אירוע ליום זה
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Event detail */}
      {selected && (
        <BottomSheet onClose={() => setSelected(null)} title={selected.title}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-medium"
                style={{ background: EVENT_COLORS[selected.type as EventType] }}
              >
                {EVENT_LABELS[selected.type as EventType]}
              </span>
              <span className="text-sm" style={{ color: '#888' }}>
                {selected.end_date && selected.end_date !== selected.date
                  ? `${selected.date} – ${selected.end_date}`
                  : selected.date}
                {selected.start_time ? ` · ${selected.start_time}–${selected.end_time}` : ''}
              </span>
              {getUserName(selected.created_by) && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f0f0ee', color: '#888' }}>
                  נוסף ע"י {getUserName(selected.created_by)}
                </span>
              )}
            </div>

            <div className="grid gap-2.5 text-sm">
              {selected.type === 'gig' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniCard label="מחיר"  value={selected.price      ? `₪${selected.price.toLocaleString()}` : '—'} />
                    <MiniCard label="מקדמה" value={selected.advance_paid ? `₪${selected.advance_paid.toLocaleString()}` : '—'} />
                    <MiniCard label="יתרה"  value={selected.price      ? `₪${((selected.price ?? 0) - (selected.advance_paid ?? 0)).toLocaleString()}` : '—'} />
                  </div>
                  {selected.payment_status && (
                    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#fafaf8' }}>
                      <span style={{ color: '#888' }}>סטטוס תשלום</span>
                      <StatusBadge status={selected.payment_status} />
                    </div>
                  )}
                  {selected.contact_name && <DetailRow label="איש קשר" value={`${selected.contact_name}${selected.contact_phone ? ` · ${selected.contact_phone}` : ''}`} />}
                  {selected.lineup    && <DetailRow label="ליינאפ"  value={selected.lineup} />}
                  {selected.equipment && <DetailRow label="ציוד"    value={selected.equipment} />}
                  {selected.location  && <DetailRow label="מיקום"   value={selected.location} />}
                </>
              )}
              {selected.type === 'meeting' && (
                <>
                  {selected.attendees     && <DetailRow label="משתתפים" value={selected.attendees} />}
                  {selected.meeting_topic && <DetailRow label="נושא"    value={selected.meeting_topic} />}
                  {selected.meeting_goals && (
                    <div className="p-3 rounded-xl" style={{ background: '#fafaf8' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#888' }}>יעדים / סיכום</p>
                      <p className="text-sm" style={{ color: '#444' }}>{selected.meeting_goals}</p>
                    </div>
                  )}
                </>
              )}
              {selected.notes && (
                <div className="p-3 rounded-xl" style={{ background: '#fafaf8' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#888' }}>הערות</p>
                  <p className="text-sm" style={{ color: '#444' }}>{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(selected)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border hover:bg-gray-50"
                style={{ borderColor: '#e5e5e0', color: '#444' }}
              >
                <Pencil size={14} /> ערוך
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: '#fde8e8', color: '#e24b4a', background: '#fef5f5' }}
              >מחק</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <BottomSheet onClose={() => { setShowForm(false); setEditingId(null) }} title={editingId ? 'ערוך אירוע' : 'אירוע חדש'} wide>
          <div className="flex flex-col gap-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([t, l]) => {
                const Icon = EVENT_ICONS[t]
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all"
                    style={{
                      background: form.type === t ? EVENT_COLORS[t] : 'white',
                      color: form.type === t ? 'white' : '#555',
                      borderColor: form.type === t ? EVENT_COLORS[t] : '#e5e5e0',
                    }}
                  >
                    <Icon size={15} />{l}
                  </button>
                )
              })}
            </div>

            <F label="כותרת *">
              <input className={inp} autoFocus value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="שם האירוע" />
            </F>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <F label="תאריך התחלה *">
                <input type="date" className={inp} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ direction: 'ltr' }} />
              </F>
              <F label="תאריך סיום">
                <input type="date" className={inp} value={form.end_date} min={form.date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  style={{ direction: 'ltr' }} />
              </F>
            </div>

            {/* Times row */}
            <div className="grid grid-cols-2 gap-3">
              <F label="שעת כניסה">
                <input type="time" className={inp} value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  style={{ direction: 'ltr' }} />
              </F>
              <F label="שעת יציאה">
                <input type="time" className={inp} value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  style={{ direction: 'ltr' }} />
              </F>
            </div>

            {form.type === 'gig' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <F label="מחיר (₪)">
                    <input type="number" className={inp} value={form.price} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </F>
                  <F label="מקדמה (₪)">
                    <input type="number" className={inp} value={form.advance_paid} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))} />
                  </F>
                </div>

                <F label="סטטוס תשלום">
                  <select className={inp} value={form.payment_status}
                    onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as PaymentStatus }))}>
                    <option value="closing">🟡 בתהליך סגירה</option>
                    <option value="unpaid">🔴 לא שולם</option>
                    <option value="advance">🟠 מקדמה עברה</option>
                    <option value="done">🟢 הכל בוצע</option>
                  </select>
                </F>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => setForm(f => ({ ...f, advance_received: !f.advance_received }))}
                    className="w-10 h-6 rounded-full flex items-center px-1"
                    style={{ background: form.advance_received ? '#52a918' : '#ddd' }}>
                    <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: form.advance_received ? 'translateX(-16px)' : 'translateX(0)' }} />
                  </div>
                  <span className="text-sm">מקדמה התקבלה</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <F label="שם איש קשר">
                    <input className={inp} value={form.contact_name}
                      onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                  </F>
                  <F label="טלפון">
                    <input className={inp} value={form.contact_phone}
                      onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                      style={{ direction: 'ltr' }} />
                  </F>
                </div>

                <F label="מיקום / ונייה">
                  <input className={inp} value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </F>
                <F label="ליינאפ">
                  <input className={inp} value={form.lineup}
                    onChange={e => setForm(f => ({ ...f, lineup: e.target.value }))}
                    placeholder="DJ-ים נוספים" />
                </F>
                <F label="ציוד במקום">
                  <input className={inp} value={form.equipment}
                    onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
                </F>
              </>
            )}

            {form.type === 'meeting' && (
              <>
                <F label="משתתפים">
                  <input className={inp} value={form.attendees}
                    onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} />
                </F>
                <F label="נושא הפגישה">
                  <input className={inp} value={form.meeting_topic}
                    onChange={e => setForm(f => ({ ...f, meeting_topic: e.target.value }))} />
                </F>
                <F label="סיכום / יעדים">
                  <textarea className={inp} rows={3} value={form.meeting_goals}
                    onChange={e => setForm(f => ({ ...f, meeting_goals: e.target.value }))} />
                </F>
              </>
            )}

            <F label="הערות">
              <textarea className={inp} rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </F>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.date}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 shadow-sm"
                style={{ background: '#e24b4a' }}
              >
                {saving ? 'שומר...' : editingId ? 'שמור שינויים' : 'שמור אירוע'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="px-5 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50"
                style={{ borderColor: '#e5e5e0', color: '#666' }}
              >ביטול</button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl text-center" style={{ background: '#fafaf8', border: '0.5px solid #f0f0ee' }}>
      <p className="text-[10px] mb-0.5" style={{ color: '#aaa' }}>{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b text-sm" style={{ borderColor: '#f0f0ee' }}>
      <span style={{ color: '#999' }}>{label}</span>
      <span className="font-medium text-left max-w-[60%]">{value}</span>
    </div>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: '#888' }}>{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#e24b4a] focus:ring-1 focus:ring-[#e24b4a]'
