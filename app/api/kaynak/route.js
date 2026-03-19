import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET() {
  try { const r = await getDb().execute('SELECT * FROM kaynaklar ORDER BY olusturulma DESC'); return NextResponse.json(r.rows) }
  catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
export async function POST(request) {
  try {
    const db = getDb(); const d = await request.json()
    const r = await db.execute({ sql:'INSERT INTO kaynaklar (baslik,yazar,yayin_yili,yayin_yeri,tur,dil,notlar) VALUES (?,?,?,?,?,?,?)', args:[d.baslik,d.yazar,d.yayin_yili,d.yayin_yeri,d.tur,d.dil,d.notlar] })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
