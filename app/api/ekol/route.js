import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET() {
  try { const r = await getDb().execute('SELECT * FROM ekoller ORDER BY id'); return NextResponse.json(r.rows) }
  catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
