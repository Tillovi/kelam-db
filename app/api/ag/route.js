import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET() {
  try { const r = await getDb().execute('SELECT ai.*, a1.ad as alim1_adi, a2.ad as alim2_adi FROM alim_iliskileri ai LEFT JOIN alimler a1 ON ai.alim1_id=a1.id LEFT JOIN alimler a2 ON ai.alim2_id=a2.id'); return NextResponse.json(r.rows) }
  catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
