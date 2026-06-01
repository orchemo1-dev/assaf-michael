'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event, PaymentStatus } from '@/lib/types'
import { ChevronDown, ChevronUp, Star, Calendar, Phone } from 'tabler-icons-react'

const today = new Date().toISOString().slice(0, 10)

// Visual config per payment status
const S: Record<PaymentStatus, { bar: string; bg: string; border: string; text: string; actionBg: string; actionText: string; label: string; urgency: number }> = {
  unpaid:  { bar: '#e24b4a', bg: '#fff8f8',  border: '#fcd5d5', text: '#e24b4a', actionBg: '#fde8e8', actionText: '#9b1c1c', label: 'לא שולם',       urgency: 3 },
  advance: { bar: '#f0a732', bg: '#fffdf5',  border: '#fce8b0', text: '#f0a732', actionBg: '#fef3c7', actionText: '#633806', label: 'מקדמה עברה',    urgency: 2 },
  closing: { bar: '#7c6ff7', bg: '#f8f7ff',  border: '#e0defe', text: '#7c6ff7', actionBg: '#eeedfe', actionText: '#3c3489', label: 'בתהליך סגירה', urgency: 1 },
  done:    { bar: '#52a918', bg: '#f8fff4',  border: '#d4edbe', text: '#52a918', actionBg: '#eaf3de', actionText: '#27500a', label: 'הכל בוצע',      urgency: 0 },
}

const FALLBACK = { bar: '#ccc', bg: 'white', border: '#e5e5e0', text: '#888', actionBg: '#f0f0ee', actionText: '#555', label: '—', urgency: -1 }

function getS(status?: PaymentStatus | null) {
  return status ? S[status] : FALLBACK
}

export default function ShowsPage() {
  const [gigs, setGigs] = useState<Event[]>([])
  const [tab, setTab]   = useState<'upcoming' | 'history'>('upcoming')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('events').select('*').eq('type', 'gig').order('date', { ascending: false })
      .then(({ data }) => setGigs(data ?? []))
  }, [])

  const upcoming = gigs
    .filter(g => g.date >= today)
    .sort((a, b) => {
      const ua = getS(a.payment_status).urgency
      const ub = getS(b.payment_status).urgency
      if (ub !== ua) return ub - ua       // higher urgency first
      return a.date.localeCompare(b.date) // then chronological
    })
  const history = gigs.filter(g => g.date < today)
  const current = tab === 'upcoming' ? upcoming : history

  // Status breakdown for upcoming
  const unpaidGigs  = upcoming.filter(g => g.payment_status === 'unpaid')
  const advanceGigs = upcoming.filter(g => g.payment_status === 'advance')
  const closingGigs = upcoming.filter(g => g.payment_status === 'closing')
  const doneGigs    = upcoming.filter(g => g.payment_status === 'done')

  const toCollect = (list: Event[]) =>
    list.reduce((s, g) => s + Math.max(0, (g.price ?? 0) - (g.advance_paid ?? 0)), 0)

  // Annual summaries for history
  const years = [...new Set(history.map(g => g.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">הופעות</h2>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: '#f0f0ee' }}>
        {([['upcoming', 'קרובות'], ['history', 'היסטוריה']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === key ? 'white' : 'transparent',
              color: tab === key ? '#111' : '#888',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upcoming — status breakdown */}
      {tab === 'upcoming' && upcoming.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatusSumCard
            status="unpaid"
            count={unpaidGigs.length}
            amount={toCollect(unpaidGigs)}
            label="לא שולם"
            sub="לגבות הכל"
          />
          <StatusSumCard
            status="advance"
            count={advanceGigs.length}
            amount={toCollect(advanceGigs)}
            label="מקדמה עברה"
            sub="יתרה פתוחה"
          />
          <StatusSumCard
            status="closing"
            count={closingGigs.length}
            amount={toCollect(closingGigs)}
            label="בתהליך סגירה"
            sub="ממתין לחוזה"
          />
          <StatusSumCard
            status="done"
            count={doneGigs.length}
            amount={0}
            label="הכל בוצע"
            sub="סגור ✓"
          />
        </div>
      )}

      {/* Gig list */}
      <div className="flex flex-col gap-3 mb-8">
        {current.map(gig => {
          const isExpanded = expanded === gig.id
          const st = getS(gig.payment_status)
          const balance = (gig.price ?? 0) - (gig.advance_paid ?? 0)
          const isPast = gig.date < today
          const daysUntil = !isPast
            ? Math.round((new Date(gig.date).getTime() - new Date(today).getTime()) / 86400000)
            : null

          // Action chip text
          let actionLabel = ''
          if (gig.payment_status === 'unpaid')  actionLabel = `לגבות ₪${(gig.price ?? 0).toLocaleString()}`
          if (gig.payment_status === 'advance' && balance > 0) actionLabel = `יתרה ₪${balance.toLocaleString()}`
          if (gig.payment_status === 'closing') actionLabel = 'לסגור חוזה'

          return (
            <div
              key={gig.id}
              className="rounded-xl overflow-hidden"
              style={{ background: st.bg, border: `1px solid ${st.border}` }}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer transition-colors"
                onClick={() => setExpanded(isExpanded ? null : gig.id)}
              >
                {/* Status bar */}
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: st.bar }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{gig.title}</p>
                    {actionLabel && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: st.actionBg, color: st.actionText }}
                      >
                        {actionLabel}
                      </span>
                    )}
                    {gig.payment_status === 'done' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#eaf3de', color: '#27500a' }}>
                        שולם ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: '#888' }}>
                    <Calendar size={11} />
                    {gig.date}
                    {gig.start_time ? ` · ${gig.start_time}` : ''}
                    {gig.location ? ` · ${gig.location}` : ''}
                    {daysUntil !== null && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: daysUntil <= 7 ? '#fde8e8' : '#f0f0ee',
                          color: daysUntil <= 7 ? '#e24b4a' : '#888',
                        }}
                      >
                        {daysUntil === 0 ? 'היום' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`}
                      </span>
                    )}
                  </p>
                  {/* Contact quick-access for non-done gigs */}
                  {gig.payment_status !== 'done' && gig.contact_name && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#888' }}>
                      <Phone size={11} />
                      {gig.contact_name}
                      {gig.contact_phone ? ` · ${gig.contact_phone}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="font-bold text-sm" style={{ color: st.text }}>
                    ₪{(gig.price ?? 0).toLocaleString()}
                  </p>
                  {gig.payment_status === 'advance' && balance > 0 && (
                    <p className="text-[11px]" style={{ color: '#aaa' }}>
                      שולם ₪{(gig.advance_paid ?? 0).toLocaleString()}
                    </p>
                  )}
                  <StarRating rating={gig.rating ?? 0} />
                </div>

                <div className="shrink-0">
                  {isExpanded ? <ChevronUp size={16} style={{ color: '#aaa' }} /> : <ChevronDown size={16} style={{ color: '#aaa' }} />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-5 py-4" style={{ borderColor: st.border }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <Detail label="איש קשר" value={gig.contact_name  || '—'} />
                    <Detail label="טלפון"   value={gig.contact_phone || '—'} ltr />
                    <Detail label="ליינאפ"  value={gig.lineup        || '—'} />
                    <Detail label="מקדמה"   value={gig.advance_paid  ? `₪${gig.advance_paid.toLocaleString()}` : '—'} />
                    <Detail
                      label="יתרה לגבייה"
                      value={balance > 0 ? `₪${balance.toLocaleString()}` : '—'}
                      highlight={balance > 0 ? st.text : undefined}
                    />
                    <Detail label="ציוד"    value={gig.equipment || '—'} />
                  </div>
                  {gig.notes && (
                    <div className="rounded-lg p-3" style={{ background: st.actionBg }}>
                      <p className="text-xs font-medium mb-1" style={{ color: st.actionText }}>הערות</p>
                      <p className="text-sm" style={{ color: '#444' }}>{gig.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {current.length === 0 && (
          <div className="py-16 text-center rounded-xl" style={{ color: '#aaa', background: 'white', border: '0.5px solid #e5e5e0' }}>
            {tab === 'upcoming' ? 'אין הופעות קרובות' : 'אין היסטוריה'}
          </div>
        )}
      </div>

      {/* Annual summaries — only in history tab */}
      {tab === 'history' && years.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">סיכום שנתי</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {years.map(yr => {
              const yrGigs    = history.filter(g => g.date.startsWith(yr))
              const total     = yrGigs.reduce((s, g) => s + (g.price ?? 0), 0)
              const avg       = yrGigs.length ? Math.round(total / yrGigs.length) : 0
              const avgRating = yrGigs.length ? (yrGigs.reduce((s, g) => s + (g.rating ?? 0), 0) / yrGigs.length).toFixed(1) : '—'
              return (
                <div key={yr} className="rounded-xl p-4" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
                  <p className="font-bold text-lg mb-3">{yr}</p>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between"><span style={{ color: '#888' }}>הופעות</span><span className="font-medium">{yrGigs.length}</span></div>
                    <div className="flex justify-between"><span style={{ color: '#888' }}>הכנסה</span><span className="font-medium">₪{total.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span style={{ color: '#888' }}>ממוצע לגיג</span><span className="font-medium">₪{avg.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span style={{ color: '#888' }}>דירוג ממוצע</span><span className="font-medium">★ {avgRating}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusSumCard({ status, count, amount, label, sub }: {
  status: PaymentStatus; count: number; amount: number; label: string; sub: string
}) {
  const st = S[status]
  return (
    <div className="rounded-xl p-3" style={{ background: count > 0 ? st.bg : 'white', border: `1px solid ${count > 0 ? st.border : '#e5e5e0'}` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium" style={{ color: count > 0 ? st.actionText : '#aaa' }}>{label}</p>
        <span
          className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
          style={{ background: count > 0 ? st.bar : '#e5e5e0', color: 'white' }}
        >
          {count}
        </span>
      </div>
      {status !== 'done' ? (
        <p className="text-base font-bold" style={{ color: count > 0 ? st.text : '#ccc' }}>
          {count > 0 ? `₪${amount.toLocaleString()}` : '—'}
        </p>
      ) : (
        <p className="text-base font-bold" style={{ color: count > 0 ? st.text : '#ccc' }}>{count > 0 ? `${count} גיגים` : '—'}</p>
      )}
      <p className="text-[10px] mt-0.5" style={{ color: '#bbb' }}>{sub}</p>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="hidden sm:flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} style={{ color: i <= rating ? '#f0a732' : '#ddd' }} />
      ))}
    </div>
  )
}

function Detail({ label, value, ltr, highlight }: { label: string; value: string; ltr?: boolean; highlight?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: '#aaa' }}>{label}</p>
      <p className="text-sm font-medium" style={{ direction: ltr ? 'ltr' : 'rtl', textAlign: ltr ? 'left' : 'right', color: highlight ?? '#333' }}>{value}</p>
    </div>
  )
}
