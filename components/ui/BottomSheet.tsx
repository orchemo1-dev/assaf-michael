'use client'

import { useEffect } from 'react'
import { X } from 'tabler-icons-react'

interface Props {
  children: React.ReactNode
  onClose: () => void
  title?: string
  wide?: boolean
}

export default function BottomSheet({ children, onClose, title, wide }: Props) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className={`
          w-full rounded-t-2xl md:rounded-2xl overflow-hidden
          md:max-h-[90vh]
          ${wide ? 'md:max-w-2xl' : 'md:max-w-md'}
        `}
        style={{ background: 'white', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#e0e0e0' }} />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#f0f0ee' }}>
            <h3 className="font-bold text-base">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: '#f7f7f5', color: '#666' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: title ? 'calc(92vh - 60px)' : '92vh' }}>
          {!title && (
            <div className="flex items-center justify-end px-5 pt-4 pb-0">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: '#f7f7f5', color: '#666' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="px-5 pb-8 pt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
