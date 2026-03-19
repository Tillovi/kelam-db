import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }
function n(v) { return (v === '' || v === undefined) ? null : v }

export async function POST(request) {
  try {
    const db = getDb()
    const d = await request.json()
    const r = await db.execute({
      sql: 'INSERT INTO alim_iliskileri (alim1_id,alim2_id,iliski_turu,aciklama) VALUES (?,?,?,?)',
      args: [ni(d.alim1_id), ni(d.alim2_id), n(d.iliski_turu), n(d.aciklama)]
    })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) {
    console.error('POST /api/iliski:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
