import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const r = await db.execute({ sql: 'SELECT g.*, k.baslik as kaynak_baslik FROM gorusler g LEFT JOIN kaynaklar k ON g.kaynak_id = k.id WHERE g.alim_id = ? ORDER BY g.konu_kategorisi, g.konu_basligi', args:[id] })
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}

export async function POST(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const d = await request.json()
    const r = await db.execute({ sql:'INSERT INTO gorusler (alim_id,konu_basligi,konu_kategorisi,icerik,kaynak_id,kaynak_sayfa,isnad_notu) VALUES (?,?,?,?,?,?,?)', args:[id,d.konu_basligi,d.konu_kategorisi,d.icerik,d.kaynak_id||null,d.kaynak_sayfa,d.isnad_notu] })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
