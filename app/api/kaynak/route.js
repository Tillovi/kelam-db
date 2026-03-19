import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

function n(v) { return (v === '' || v === undefined) ? null : v }
function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }

export async function GET() {
  try {
    const r = await getDb().execute('SELECT * FROM kaynaklar ORDER BY olusturulma DESC')
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const db = getDb()
    const d = await request.json()
    const r = await db.execute({
      sql: 'INSERT INTO kaynaklar (baslik,yazar,yayin_yili,yayin_yeri,tur,dil,notlar) VALUES (?,?,?,?,?,?,?)',
      args: [n(d.baslik), n(d.yazar), ni(d.yayin_yili), n(d.yayin_yeri), n(d.tur), n(d.dil)||'ar', n(d.notlar)]
    })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) {
    console.error('POST /api/kaynak:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
