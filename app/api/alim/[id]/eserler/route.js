import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const r = await db.execute({ sql:'SELECT e.*, a.ad as alim_adi FROM eserler e LEFT JOIN alimler a ON e.alim_id = a.id WHERE e.alim_id = ? OR e.esas_eser_id IN (SELECT id FROM eserler WHERE alim_id = ?) ORDER BY e.esas_eser_id NULLS FIRST', args:[id,id] })
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
