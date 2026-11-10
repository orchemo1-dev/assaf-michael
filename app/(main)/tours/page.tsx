'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plane } from 'tabler-icons-react'

type Trip = { id: string; name: string; start_date?: string; end_date?: string }
type Gig = { id: string; trip_id: string; date: string; title: string; location?: string; price?: number; currency?: string; price_original?: number }
type Expense = { id: string; trip_id: string; category: string; label?: string; amount: number; currency: string; amount_ils: number; artist_ids?: string[] | null }

const CUR: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' }
const CAT: Record<string, string> = { flight: '✈️ טיסה', hotel: '🏨 מלון', transport: '🚕 הסעות', other: '➕ אחר' }
const ils = (n: number) => '₪' + Math.round(n || 0).toLocaleString('he-IL')
const money = (n: number, c?: string) => (c && c !== 'ILS' ? (CUR[c] || c) + Math.round(n || 0).toLocaleString('he-IL') : ils(n))
const d = (s?: string) => (s ? s.slice(8, 10) + '.' + s.slice(5, 7) : '')
const COMMISSION = 0.3

export default function ToursPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [gigs, setGigs] = useState<Gig[]>([])
  const [exps, setExps] = useState<Expense[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    ;(async () => {
      const { data: g } = await supabase.from('events')
        .select('id,trip_id,date,title,location,price,currency,price_original')
        .eq('type', 'gig').not('trip_id', 'is', null).order('date')
      const myGigs = (g ?? []) as Gig[]
      const ids = [...new Set(myGigs.map(x => x.trip_id))]
      if (!ids.length) { setLoading(false); return }
      const [{ data: t }, { data: x }] = await Promise.all([
        supabase.from('trips').select('id,name,start_date,end_date').in('id', ids).order('start_date', { ascending: false }),
        supabase.from('trip_expenses').select('id,trip_id,category,label,amount,currency,amount_ils,artist_ids').in('trip_id', ids).order('created_at'),
      ])
      const c: Record<string, number> = {}
      await Promise.all(ids.map(async id => {
        const { data } = await supabase.rpc('trip_artist_count', { t: id })
        c[id] = Number(data) || 1
      }))
      setGigs(myGigs); setTrips((t ?? []) as Trip[]); setExps((x ?? []) as Expense[]); setCounts(c); setLoading(false)
    })()
  }, [])

  if (loading) return <div className="text-sm" style={{ color: '#888' }}>טוען…</div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Plane size={22} style={{ color: '#e24b4a' }} />
        <h2 className="text-xl font-bold">טורים ונסיעות</h2>
      </div>
      <p className="text-sm mb-5" style={{ color: '#888' }}>
        הגיגים וההוצאות של כל טור. העמלה לסוכנות היא 30% מהרווח אחרי ההוצאות. הנתונים מתעדכנים ישירות מהסוכנות.
      </p>

      {!trips.length && (
        <div className="rounded-xl p-6 text-sm" style={{ background: 'white', border: '0.5px solid #e5e5e0', color: '#888' }}>
          אין עדיין טורים.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {trips.map(t => {
          const tg = gigs.filter(g => g.trip_id === t.id)
          const tx = exps.filter(e => e.trip_id === t.id).map(e => {
            const share = e.artist_ids && e.artist_ids.length ? e.artist_ids.length : (counts[t.id] || 1)
            return { ...e, mine: Number(e.amount_ils || 0) / share, shared: share > 1 }
          })
          const inc = tg.reduce((s, g) => s + Number(g.price || 0), 0)
          const ex = tx.reduce((s, e) => s + e.mine, 0)
          const net = inc - ex
          const com = Math.max(0, net) * COMMISSION
          const tiles = [
            { k: 'הכנסות', v: ils(inc) },
            { k: 'הוצאות', v: ils(ex) },
            { k: 'רווח נטו', v: ils(net) },
            { k: 'לסוכנות (30%)', v: ils(com) },
            { k: 'נשאר לי', v: ils(net - com), strong: true },
          ]
          return (
            <div key={t.id} className="rounded-xl p-4 md:p-5" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-base font-bold">✈️ {t.name}</h3>
                <span className="text-sm" style={{ color: '#888' }}>
                  {d(t.start_date)}{t.end_date && t.end_date !== t.start_date ? ' – ' + d(t.end_date) : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {tiles.map(x => (
                  <div key={x.k} className="rounded-lg p-3" style={{ background: x.strong ? '#fde8e8' : '#f7f7f5' }}>
                    <div className="text-xs mb-1" style={{ color: '#888' }}>{x.k}</div>
                    <div className="text-lg font-bold" style={{ color: x.strong ? '#e24b4a' : '#111' }}>{x.v}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold mb-2">גיגים</div>
                  {tg.map(g => (
                    <div key={g.id} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      <div>
                        <span style={{ color: '#888' }}>{d(g.date)}</span> · <b>{g.title}</b>
                        {g.location ? <span style={{ color: '#888' }}> · {g.location}</span> : null}
                      </div>
                      <div className="whitespace-nowrap">
                        {g.currency && g.currency !== 'ILS'
                          ? <>{money(g.price_original || 0, g.currency)} <span style={{ color: '#888' }}>({ils(g.price || 0)})</span></>
                          : ils(g.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">הוצאות</div>
                  {!tx.length && <div className="text-sm" style={{ color: '#888' }}>אין הוצאות</div>}
                  {tx.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: '0.5px solid #f0f0ee' }}>
                      <div>
                        {CAT[e.category] || e.category} {e.label}
                        {e.shared && <span style={{ color: '#888' }}> · החלק שלי</span>}
                      </div>
                      <div className="whitespace-nowrap">
                        {e.currency !== 'ILS' ? <span style={{ color: '#888' }}>{money(e.amount, e.currency)} · </span> : null}
                        {ils(e.mine)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
