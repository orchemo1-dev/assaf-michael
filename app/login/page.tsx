'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('מייל או סיסמה שגויים')
    } else {
      router.push('/calendar')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f5' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'white', border: '0.5px solid #e5e5e0' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide">
            ASSAF <span style={{ color: '#e24b4a' }}>MICHAEL</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>ניהול קריירה</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#444' }}>כתובת מייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                borderColor: '#e5e5e0',
                direction: 'ltr',
                textAlign: 'left',
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#444' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                borderColor: '#e5e5e0',
                direction: 'ltr',
                textAlign: 'left',
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#e24b4a' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm mt-1 transition-opacity disabled:opacity-60"
            style={{ background: '#e24b4a' }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
