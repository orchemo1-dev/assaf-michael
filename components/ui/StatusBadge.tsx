'use client'

import type { PaymentStatus } from '@/lib/types'

const STATUS_MAP: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  closing: { label: 'בתהליך סגירה', bg: '#eeedfe', text: '#3c3489' },
  unpaid:  { label: 'לא שולם',       bg: '#fde8e8', text: '#791f1f' },
  advance: { label: 'מקדמה עברה',    bg: '#faeeda', text: '#633806' },
  done:    { label: 'הכל בוצע',      bg: '#eaf3de', text: '#27500a' },
}

const DOT_COLOR: Record<PaymentStatus, string> = {
  closing: '#7c6ff7',
  unpaid:  '#e24b4a',
  advance: '#f0a732',
  done:    '#52a918',
}

export default function StatusBadge({ status }: { status: PaymentStatus }) {
  const s = STATUS_MAP[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: DOT_COLOR[status] }}
      />
      {s.label}
    </span>
  )
}
