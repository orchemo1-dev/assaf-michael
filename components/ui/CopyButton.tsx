'use client'

import { useState } from 'react'
import { Copy, Check } from 'tabler-icons-react'

export default function CopyButton({ text, label = 'העתק' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
      style={{
        background: copied ? '#eaf3de' : 'white',
        borderColor: copied ? '#52a918' : '#e5e5e0',
        color: copied ? '#27500a' : '#666',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'הועתק ✓' : label}
    </button>
  )
}
