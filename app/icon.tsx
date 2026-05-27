import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e24b4a',
          borderRadius: '96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'sans-serif',
            fontWeight: 900,
            letterSpacing: '-2px',
          }}
        >
          <span style={{ fontSize: 200, lineHeight: 1 }}>AM</span>
          <div
            style={{
              width: 60,
              height: 4,
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 2,
              marginTop: 16,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
