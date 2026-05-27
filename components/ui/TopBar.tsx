'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Checkbox,
  Speakerphone,
  Microphone2,
  Users,
  CurrencyShekel,
  History,
  Logout,
  Menu,
  X,
} from 'tabler-icons-react'

const NAV_ITEMS = [
  { href: '/calendar',  label: 'יומן',                icon: Calendar },
  { href: '/tasks',     label: 'משימות',              icon: Checkbox },
  { href: '/marketing', label: 'מרקטינג',             icon: Speakerphone },
  { href: '/epk',       label: 'EPK',                 icon: Microphone2 },
  { href: '/contacts',  label: 'אנשי קשר',            icon: Users },
  { href: '/finance',   label: 'פיננסים',             icon: CurrencyShekel },
  { href: '/shows',     label: 'היסטוריית הופעות',    icon: History },
]

const AVATARS = [
  { label: 'א',  color: '#e24b4a', title: 'אסף מיכאל' },
  { label: 'מ1', color: '#534ab7', title: 'מנהל 1' },
  { label: 'מ2', color: '#27a566', title: 'מנהל 2' },
]

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{ background: 'white', borderColor: '#e5e5e0' }}
      >
        <div className="flex items-center justify-between px-4 h-14 max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link href="/calendar" className="shrink-0 text-lg font-bold tracking-wide">
            ASSAF <span style={{ color: '#e24b4a' }}>MICHAEL</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: active ? '#fde8e8' : 'transparent',
                    color: active ? '#e24b4a' : '#555',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop: Avatars + logout */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex -space-x-1 space-x-reverse">
              {AVATARS.map((av) => (
                <div
                  key={av.label}
                  title={av.title}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                  style={{ background: av.color }}
                >
                  {av.label}
                </div>
              ))}
            </div>
            <button onClick={handleLogout} title="יציאה" className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: '#888' }}>
              <Logout size={16} />
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#555' }}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 right-0 left-0 py-2 shadow-lg"
            style={{ background: 'white', borderBottom: '0.5px solid #e5e5e0' }}
            onClick={e => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium"
                  style={{
                    background: active ? '#fde8e8' : 'transparent',
                    color: active ? '#e24b4a' : '#333',
                    borderRight: active ? '3px solid #e24b4a' : '3px solid transparent',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between px-5 py-3 mt-1 border-t" style={{ borderColor: '#f0f0ee' }}>
              <div className="flex gap-1.5">
                {AVATARS.map((av) => (
                  <div key={av.label} title={av.title} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: av.color }}>
                    {av.label}
                  </div>
                ))}
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm" style={{ color: '#888' }}>
                <Logout size={15} />
                יציאה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
