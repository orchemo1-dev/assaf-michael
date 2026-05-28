import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    cache: 'no-store',
  })
  const data = await res.json()
  const users = (data.users ?? []).map((u: { id: string; email: string }) => ({
    id: u.id,
    email: u.email,
    name: emailToName(u.email),
  }))
  return NextResponse.json(users)
}

function emailToName(email: string): string {
  const map: Record<string, string> = {
    'asafoon2@gmail.com': 'אסף מיכאל',
    'yarinrevah2@gmail.com': 'יארין רבח',
    'orchemo1@gmail.com': 'אורכמו',
  }
  return map[email] ?? email.split('@')[0]
}
