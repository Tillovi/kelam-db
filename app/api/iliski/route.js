import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function POST(request) {
  try {
    const db = getDb(); const d = await request.json()
    const r = await db.execute({ sql:'INSERT INTO alim_iliskileri (alim1_id,alim2_id,iliski_turu,aciklama) VALUES (?,?,?,?)', args:[d.alim1_id,d.alim2_id,d.iliski_turu,d.aciklama] })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
