import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET() {
  try { const r = await getDb().execute('SELECT e.*, a.ad as alim_adi FROM eserler e LEFT JOIN alimler a ON e.alim_id = a.id ORDER BY e.ad'); return NextResponse.json(r.rows) }
  catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
export async function POST(request) {
  try {
    const db = getDb(); const d = await request.json()
    const r = await db.execute({ sql:'INSERT INTO eserler (ad,ad_arapca,alim_id,tur,esas_eser_id,aciklama,isnad_bilgisi) VALUES (?,?,?,?,?,?,?)', args:[d.ad,d.ad_arapca,d.alim_id,d.tur,d.esas_eser_id||null,d.aciklama,d.isnad_bilgisi] })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
