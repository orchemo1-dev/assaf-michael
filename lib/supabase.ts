import { createBrowserClient } from '@supabase/ssr'

const ARTIST_ID = process.env.NEXT_PUBLIC_ARTIST_ID

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ARTIST_ID ? { global: { headers: { 'x-artist-id': ARTIST_ID } } } : undefined
  )
}
