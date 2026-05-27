'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Event, PaymentStatus } from '@/lib/types'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronRight, ChevronLeft } from 'tabler-icons-react'

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

export default function FinancePage() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [gigs, setGigs] = useState<Event[]>([])
  const [yearGigs, setYearGigs] = useState<Event[]>([])

  const supabase = createClient()

  useEffect(() => {
    const start = `${year}-01-01`
    const end   = `${year}-12-31`
    supabase.from('events').select('*').eq('type', 'gig').gte('date', start).lte('date', end)
      .then(({ data }) => setYearGigs(data ?? []))
  }, [year])

  useEffect(() => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end   = `${year}-${String(month + 1).padStart(2, '0')}-31`
    supabase.from('events').select('*').eq('type', 'gig').gte('date', start).lte('date', end)
      .then(({ data }) => setGigs(data ?? []))
  }, [year, month])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Calculations
  const totalMonth = gigs.reduce((s, g) => s + (g.price ?? 0), 0)
  const received   = gigs.reduce((s, g) => {
    if (g.payment_status === 'done') return s + (g.price ?? 0)
    if (g.payment_status === 'advance') return s + (g.advance_paid ?? 0)
    return s
  }, 0)
  const pending  = totalMonth - received
  const receivedPct = totalMonth > 0 ? Math.round((received / totalMonth) * 100) : 0

  // Monthly chart data
  const chartData = MONTHS_HE.map((name, mi) => {
    const mGigs = yearGigs.filter(g => new Date(g.date).getMonth() === mi)
    const total = mGigs.reduce((s, g) => s + (g.price ?? 0), 0)
    const rcvd  = mGigs.reduce((s, g) => {
      if (g.payment_status === 'done') return s + (g.price ?? 0)
      if (g.payment_status === 'advance') return s + (g.advance_paid ?? 0)
      return s
    }, 0)
    return { name: name.slice(0, 3), received: rcvd, pending: total - rcvd }
  })

  // Breakdown by venue
  const venueMap: Record<string, number> = {}
  gigs.forEach(g => {
    const v = g.location || 'לא ידוע'
    venueMap[v] = (venueMap[v] ?? 0) + (g.price ?? 0)
  })

  // Status breakdown
  const statusCounts: Record<string, number> = { closing: 0, unpaid: 0, advance: 0, done: 0 }
  gigs.forEach(g => { if (g.payment_status) statusCounts[g.payment_status]++ })

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        <h2 className="text-xl font-bold min-w-[180px] text-center">{MONTHS_HE[month]} {year}</h2>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="סה״כ חודש" value={`₪${totalMonth.toLocaleString()}`} color="#111" />
        <KpiCard label="התקבל" value={`₪${received.toLocaleString()}`} sub={`${receivedPct}% מהסכום`} color="#52a918" />
        <KpiCard label="ממתין לתשלום" value={`₪${pending.toLocaleString()}`} color="#f0a732" />
        <KpiCard label="גיגים החודש" value={String(gigs.length)} sub="הופעות" color="#534ab7" />
      </div>

      {/* Chart */}
      <div className="rounded-xl p-5 mb-6" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
        <h3 className="font-semibold mb-4">הכנסות חודשיות – {year}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₪${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => `₪${Number(v).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="received"  name="התקבל"       fill="#52a918" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending"   name="ממתין"        fill="#f0a732" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* By venue */}
        <div className="rounded-xl p-5" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
          <h3 className="font-semibold mb-3 text-sm">הכנסה לפי מקום</h3>
          {Object.keys(venueMap).length === 0 ? (
            <p className="text-sm" style={{ color: '#aaa' }}>אין נתונים</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(venueMap).sort((a, b) => b[1] - a[1]).map(([venue, amount]) => (
                <div key={venue} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#e24b4a' }} />
                    <span>{venue}</span>
                  </div>
                  <span className="font-semibold">₪{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl p-5" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
          <h3 className="font-semibold mb-3 text-sm">סטטוס תשלומים</h3>
          <div className="flex flex-col gap-2">
            {(Object.entries(statusCounts) as [PaymentStatus, number][]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status} />
                <span className="font-medium">{count} גיגים</span>
              </div>
            ))}
          </div>
          {totalMonth > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: '#888' }}>
                <span>אחוז גבייה</span>
                <span>{receivedPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f0f0ee' }}>
                <div className="h-full rounded-full" style={{ width: `${receivedPct}%`, background: '#52a918' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gigs table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid #e5e5e0', background: 'white' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: '#f0f0ee' }}>
          <h3 className="font-semibold text-sm">פירוט גיגים – {MONTHS_HE[month]}</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#fafaf8', borderBottom: '0.5px solid #e5e5e0' }}>
              {['תאריך', 'מקום', 'מחיר', 'מקדמה', 'יתרה', 'סטטוס', 'התקדמות'].map(h => (
                <th key={h} className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gigs.map((g, i) => {
              const balance = (g.price ?? 0) - (g.advance_paid ?? 0)
              const pct = g.price ? Math.round(((g.payment_status === 'done' ? g.price : (g.advance_paid ?? 0)) / g.price) * 100) : 0
              return (
                <tr key={g.id} style={{ borderBottom: i < gigs.length - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: '#666' }}>{g.date}</td>
                  <td className="px-4 py-3 font-medium">{g.location || g.title}</td>
                  <td className="px-4 py-3">₪{(g.price ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: '#888' }}>₪{(g.advance_paid ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3" style={{ color: balance > 0 ? '#f0a732' : '#52a918' }}>₪{balance.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {g.payment_status && <StatusBadge status={g.payment_status} />}
                  </td>
                  <td className="px-4 py-3 w-24">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0ee' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#52a918' }} />
                      </div>
                      <span className="text-xs" style={{ color: '#888' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {gigs.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center" style={{ color: '#aaa' }}>אין גיגים החודש</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
      <p className="text-xs mb-1" style={{ color: '#888' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{sub}</p>}
    </div>
  )
}
