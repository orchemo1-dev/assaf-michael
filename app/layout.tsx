import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'Assaf Michael – ניהול קריירה',
  description: 'מערכת ניהול קריירה פנימית',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body
        className="min-h-screen bg-[#f7f7f5]"
        style={{ fontFamily: 'var(--font-heebo), Arial, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
