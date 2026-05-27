import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Assaf Michael',
    short_name: 'Assaf Michael',
    description: 'ניהול קריירה – אסף מיכאל',
    start_url: '/calendar',
    display: 'standalone',
    background_color: '#f7f7f5',
    theme_color: '#e24b4a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
