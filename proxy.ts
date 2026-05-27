import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ProxyConfig } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/login') return NextResponse.next()

  // Check for Supabase auth cookie (multiple possible names)
  const hasSession =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb-auth-token') ||
    [...req.cookies.getAll().map(c => c.name)].some(n => n.startsWith('sb-') && n.endsWith('-auth-token'))

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config: ProxyConfig = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
