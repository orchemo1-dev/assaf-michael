'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import CopyButton from '@/components/ui/CopyButton'
import { ExternalLink } from 'tabler-icons-react'

const DEFAULT_EPK = {
  bio_en: 'Assaf Michael is a DJ and electronic music producer from Tel Aviv, making waves in the global house scene. Resident DJ of Magical Sunrise and Rabbit TLV. Founder of Connection Community.',
  labels: 'Maccabi House IL, Nervous Records NYC, Three Records UK, Three Hands Records IT, Mau House IL',
  supported_by: 'Keinemusik, Solomun, Hugel, Mau P, Pete Tong, Andrea Oliva, Nick Fanciulli, Adriatique, Camelphat, Mochakk, Louie Vega, Steve Lawler, Elif, Adam Ten, Mita Gami, Yulia Niko',
  rider: 'Pioneer CDJ-3000 × 2, Pioneer DJM-900NXS2, Booth Monitor, Stage Plot on request',
  beatport_chart: '#2 Indie Dance',
  streams: '500K+',
  website: 'assafmichael.com',
}

const LINKS = [
  { label: 'assafmichael.com', url: 'https://assafmichael.com' },
  { label: 'Beatport', url: 'https://www.beatport.com/artist/assaf-michael' },
  { label: 'Spotify', url: 'https://open.spotify.com/artist/search/assaf%20michael' },
  { label: 'Instagram', url: 'https://instagram.com/assafmichael' },
]

export default function EpkPage() {
  const [data, setData] = useState<Record<string, string>>(DEFAULT_EPK)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.from('epk_data').select('*').then(({ data: rows }) => {
      if (!rows?.length) return
      const merged: Record<string, string> = { ...DEFAULT_EPK }
      rows.forEach(r => { if (r.field_value) merged[r.field_name] = r.field_value })
      setData(merged)
    })
  }, [])

  const handleSaveField = async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('epk_data').upsert(
      { field_name: key, field_value: editVal, updated_by: user?.id, updated_at: new Date().toISOString() },
      { onConflict: 'field_name' }
    )
    setData(d => ({ ...d, [key]: editVal }))
    setEditing(null)
  }

  const labels = (data.labels ?? '').split(', ')
  const supported = (data.supported_by ?? '').split(', ')

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">EPK – Electronic Press Kit</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Labels */}
          <Card title="לייבלים" action={<CopyButton text={data.labels} label="העתק הכל" />}>
            <div className="flex flex-wrap gap-1.5">
              {labels.map(l => (
                <span key={l} className="px-2.5 py-1 rounded-full text-xs font-medium bg-black text-white">{l.trim()}</span>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card title="סטטיסטיקות">
            <div className="flex flex-col gap-2">
              <StatRow label="Beatport Chart" value={data.beatport_chart} field="beatport_chart" editing={editing} editVal={editVal} onEdit={() => { setEditing('beatport_chart'); setEditVal(data.beatport_chart) }} onSave={() => handleSaveField('beatport_chart')} onEditValChange={setEditVal} />
              <StatRow label="Streams" value={data.streams} field="streams" editing={editing} editVal={editVal} onEdit={() => { setEditing('streams'); setEditVal(data.streams) }} onSave={() => handleSaveField('streams')} onEditValChange={setEditVal} />
            </div>
          </Card>

          {/* Rider */}
          <Card title="ריידר">
            {editing === 'rider' ? (
              <div className="flex flex-col gap-2">
                <textarea className={inp} rows={3} value={editVal} onChange={e => setEditVal(e.target.value)} />
                <button onClick={() => handleSaveField('rider')} className="px-3 py-1.5 rounded-lg text-white text-sm" style={{ background: '#e24b4a' }}>שמור</button>
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{data.rider}</p>
                <button onClick={() => { setEditing('rider'); setEditVal(data.rider) }} className="text-xs mt-2" style={{ color: '#aaa' }}>ערוך</button>
              </div>
            )}
          </Card>

          {/* Quick links */}
          <Card title="קישורים מהירים">
            <div className="flex flex-col gap-2">
              {LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
                  style={{ color: '#0284c7' }}
                >
                  <ExternalLink size={13} />
                  {l.label}
                </a>
              ))}
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Bio */}
          <Card
            title="ביוגרפיה (אנגלית)"
            action={<CopyButton text={data.bio_en} />}
          >
            {editing === 'bio_en' ? (
              <div className="flex flex-col gap-2">
                <textarea className={inp} rows={5} value={editVal} onChange={e => setEditVal(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveField('bio_en')} className="px-3 py-1.5 rounded-lg text-white text-sm" style={{ background: '#e24b4a' }}>שמור</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: '#e5e5e0', color: '#666' }}>ביטול</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{data.bio_en}</p>
                <button onClick={() => { setEditing('bio_en'); setEditVal(data.bio_en) }} className="text-xs mt-2" style={{ color: '#aaa' }}>ערוך</button>
              </div>
            )}
          </Card>

          {/* Supported by */}
          <Card title="תמיכה מאמנים" action={<CopyButton text={data.supported_by} label="העתק הכל" />}>
            <div className="flex flex-wrap gap-1.5">
              {supported.map(a => (
                <span key={a} className="px-2.5 py-1 rounded-full text-xs font-medium border" style={{ background: '#f7f7f5', color: '#555', borderColor: '#e5e5e0' }}>
                  {a.trim()}
                </span>
              ))}
            </div>
            {editing === 'supported_by' ? (
              <div className="flex flex-col gap-2 mt-3">
                <textarea className={inp} rows={3} value={editVal} onChange={e => setEditVal(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => handleSaveField('supported_by')} className="px-3 py-1.5 rounded-lg text-white text-sm" style={{ background: '#e24b4a' }}>שמור</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg border text-sm" style={{ borderColor: '#e5e5e0', color: '#666' }}>ביטול</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setEditing('supported_by'); setEditVal(data.supported_by) }} className="text-xs mt-2" style={{ color: '#aaa' }}>ערוך</button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'white', border: '0.5px solid #e5e5e0' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatRow({
  label, value, field, editing, editVal,
  onEdit, onSave, onEditValChange,
}: {
  label: string; value: string; field: string; editing: string | null; editVal: string;
  onEdit: () => void; onSave: () => void; onEditValChange: (v: string) => void;
}) {
  if (editing === field) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs shrink-0" style={{ color: '#888' }}>{label}:</span>
        <input className="flex-1 px-2 py-1 rounded border text-xs" value={editVal} onChange={e => onEditValChange(e.target.value)} />
        <button onClick={onSave} className="px-2 py-0.5 rounded text-white text-xs" style={{ background: '#e24b4a' }}>✓</button>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: '#888' }}>{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-sm">{value}</span>
        <button onClick={onEdit} className="text-[10px]" style={{ color: '#ccc' }}>ערוך</button>
      </div>
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-[#e24b4a]'
