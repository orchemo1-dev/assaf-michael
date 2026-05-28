'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { ChevronDown, ChevronUp, Star, Calendar } from 'tabler-icons-react'

const today = new Date().toISOString().slice(0, 10)

export default function ShowsPage() {
  const [gigs, setGigs]   = useState<Event[]>([])
  const [tab, setTab]     = useState<'upcoming' | 'history'>('upcoming')
  const [expanded, setExpanded] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('type', 'gig')
      .order('date', { ascending: false })
      .then(({ data }) => setGigs(data ?? []))
  }, [])

  const upcoming = gigs.filter(g => g.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const history  = gigs.filter(g => g.date < today)

  const current = tab === 'upcoming' ? upcoming : history

  // Projected / actual income
  const upcomingIncome = upcoming.reduce((s, g) => s + (g.price ?? 0), 0)
  const upcomingUnpaid = upcoming.reduce((s, g) => {
    const paid = g.advance_paid ?? 0
    return s + Math.max(0, (g.price ?? 0) - paid)
  }, 0)

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

      {/* Upcoming — income summary */}
      {tab === 'upcoming' && upcoming.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <SumCard label="הכנסה צפויה" value={`₪${upcomingIncome.toLocaleString()}`} color="#639922" />
          <SumCard label="עוד לגבות" value={`₪${upcomingUnpaid.toLocaleString()}`} color="#ba7517" />
          <SumCard label="הופעות קרובות" value={String(upcoming.length)} color="#534ab7" />
        </div>
      )}

      {/* Gig list */}
      <div className="flex flex-col gap-3 mb-8">
        {current.map(gig => {
          const isExpanded = expanded === gig.id
          const balance = (gig.price ?? 0) - (gig.advance_paid ?? 0)
          const isPast = gig.date < today
          const daysUntil = !isPast
            ? Math.round((new Date(gig.date).getTime() - new Date(today).getTime()) / 86400000)
            : null

          return (
            <div key={gig.id} className="rounded-xl overflow-hidden" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#fafaf8] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : gig.id)}
              >
                <div className="w-1 h-12 rounded-full shrink-0" style={{ background: '#e24b4a' }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{gig.title}</p>
                    {gig.payment_status && <StatusBadge status={gig.payment_status} />}
                  </div>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#888' }}>
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
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-semibold text-sm" style={{ color: gig.payment_status === 'done' ? '#52a918' : '#f0a732' }}>
                    ₪{(gig.price ?? 0).toLocaleString()}
                  </p>
                  <StarRating rating={gig.rating ?? 0} />
                  {isExpanded ? <ChevronUp size={16} style={{ color: '#aaa' }} /> : <ChevronDown size={16} style={{ color: '#aaa' }} />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-5 py-4" style={{ borderColor: '#f0f0ee', background: '#fafaf8' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <Detail label="איש קשר"  value={gig.contact_name  || '—'} />
                    <Detail label="טלפון"    value={gig.contact_phone || '—'} ltr />
                    <Detail label="ליינאפ"   value={gig.lineup        || '—'} />
                    <Detail label="מקדמה"    value={gig.advance_paid  ? `₪${gig.advance_paid.toLocaleString()}` : '—'} />
                    <Detail label="יתרה"     value={`₪${balance.toLocaleString()}`} />
                    <Detail label="ציוד"     value={gig.equipment     || '—'} />
                  </div>
                  {gig.notes && (
                    <div className="rounded-lg p-3" style={{ background: '#f0f0ee' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#888' }}>הערות</p>
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
              const yrGigs  = history.filter(g => g.date.startsWith(yr))
              const total   = yrGigs.reduce((s, g) => s + (g.price ?? 0), 0)
              const avg     = yrGigs.length ? Math.round(total / yrGigs.length) : 0
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

function SumCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
      <p className="text-xs mb-1" style={{ color: '#888' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
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

function Detail({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: '#aaa' }}>{label}</p>
      <p className="text-sm" style={{ direction: ltr ? 'ltr' : 'rtl', textAlign: ltr ? 'left' : 'right' }}>{value}</p>
    </div>
  )
}
