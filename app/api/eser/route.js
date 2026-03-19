import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

function n(v) { return (v === '' || v === undefined) ? null : v }
function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }

export async function GET() {
  try {
    const r = await getDb().execute('SELECT e.*, a.ad as alim_adi FROM eserler e LEFT JOIN alimler a ON e.alim_id = a.id ORDER BY e.ad')
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const db = getDb()
    const d = await request.json()
    const r = await db.execute({
      sql: 'INSERT INTO eserler (ad,ad_arapca,alim_id,tur,esas_eser_id,aciklama,isnad_bilgisi) VALUES (?,?,?,?,?,?,?)',
      args: [n(d.ad), n(d.ad_arapca), ni(d.alim_id), n(d.tur), ni(d.esas_eser_id), n(d.aciklama), n(d.isnad_bilgisi)]
    })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) {
    console.error('POST /api/eser:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
