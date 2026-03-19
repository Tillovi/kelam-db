import { NextResponse } from 'next/server'
export async function POST() {
  const res = NextResponse.json({ basarili: true })
  res.cookies.set('kelam_oturum', '', { maxAge: 0, path: '/' })
  return res
}
