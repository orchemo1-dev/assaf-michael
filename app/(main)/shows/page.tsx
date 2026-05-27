'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import { ChevronDown, ChevronUp, Star } from 'tabler-icons-react'

const FILTERS = ['הכל', '2025', '2024', '2023', 'פסטיבלים', 'מועדונים', 'פרטי']

export default function ShowsPage() {
  const [gigs, setGigs] = useState<Event[]>([])
  const [filter, setFilter] = useState('הכל')
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

  const filtered = gigs.filter(g => {
    if (filter === 'הכל') return true
    if (['2025', '2024', '2023'].includes(filter)) return g.date.startsWith(filter)
    if (filter === 'פסטיבלים') return (g.notes ?? '').includes('פסטיבל') || (g.title ?? '').includes('פסטיבל')
    if (filter === 'מועדונים') return (g.notes ?? '').includes('מועדון') || (g.location ?? '').includes('Club')
    return true
  })

  // Annual summary
  const years = [...new Set(gigs.map(g => g.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">היסטוריית הופעות</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-sm font-medium border transition-colors"
            style={{
              background: filter === f ? '#111' : 'white',
              color: filter === f ? 'white' : '#555',
              borderColor: filter === f ? '#111' : '#e5e5e0',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Shows list */}
      <div className="flex flex-col gap-3 mb-8">
        {filtered.map(gig => {
          const isExpanded = expanded === gig.id
          const balance = (gig.price ?? 0) - (gig.advance_paid ?? 0)
          const fullyPaid = gig.payment_status === 'done'

          return (
            <div
              key={gig.id}
              className="rounded-xl overflow-hidden"
              style={{ background: 'white', border: '0.5px solid #e5e5e0' }}
            >
              {/* Collapsed row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#fafaf8] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : gig.id)}
              >
                {/* Color bar */}
                <div className="w-1 h-12 rounded-full shrink-0" style={{ background: '#e24b4a' }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{gig.title}</p>
                    {gig.payment_status && <StatusBadge status={gig.payment_status} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                    {gig.date}
                    {gig.start_time ? ` | ${gig.start_time}–${gig.end_time}` : ''}
                    {gig.location ? ` | ${gig.location}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: fullyPaid ? '#52a918' : '#f0a732' }}
                  >
                    ₪{(gig.price ?? 0).toLocaleString()}
                  </p>
                  <StarRating rating={gig.rating ?? 0} />
                  {isExpanded ? <ChevronUp size={16} style={{ color: '#aaa' }} /> : <ChevronDown size={16} style={{ color: '#aaa' }} />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t px-5 py-4" style={{ borderColor: '#f0f0ee', background: '#fafaf8' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <Detail label="פרומוטר / איש קשר" value={gig.contact_name || '—'} />
                    <Detail label="טלפון" value={gig.contact_phone || '—'} ltr />
                    <Detail label="ליינאפ" value={gig.lineup || '—'} />
                    <Detail label="מקדמה" value={gig.advance_paid ? `₪${gig.advance_paid.toLocaleString()}` : '—'} />
                    <Detail label="יתרה" value={`₪${balance.toLocaleString()}`} />
                    <Detail label="ציוד" value={gig.equipment || '—'} />
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
        {filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: '#aaa' }}>אין הופעות</div>
        )}
      </div>

      {/* Annual summaries */}
      {years.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">סיכום שנתי</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {years.map(yr => {
              const yrGigs = gigs.filter(g => g.date.startsWith(yr))
              const total = yrGigs.reduce((s, g) => s + (g.price ?? 0), 0)
              const avg   = yrGigs.length ? Math.round(total / yrGigs.length) : 0
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i =>
        i <= rating
          ? <Star key={i} size={13} style={{ color: '#f0a732' }} />
          : <Star key={i} size={13} style={{ color: '#ddd' }} />
      )}
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
