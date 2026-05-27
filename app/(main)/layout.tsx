import TopBar from '@/components/ui/TopBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#f7f7f5' }}>
      <TopBar />
      <main className="max-w-screen-xl mx-auto px-3 py-4 md:px-6 md:py-6">{children}</main>
    </div>
  )
}
