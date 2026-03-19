import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const r = await db.execute({ sql:`SELECT ai.*, CASE WHEN ai.alim1_id=? THEN ai.alim2_id ELSE ai.alim1_id END as diger_alim_id, CASE WHEN ai.alim1_id=? THEN a2.ad ELSE a1.ad END as diger_alim_adi, CASE WHEN ai.alim1_id=? THEN a2.vefat_hicri ELSE a1.vefat_hicri END as vefat_hicri FROM alim_iliskileri ai LEFT JOIN alimler a1 ON ai.alim1_id=a1.id LEFT JOIN alimler a2 ON ai.alim2_id=a2.id WHERE ai.alim1_id=? OR ai.alim2_id=?`, args:[id,id,id,id,id] })
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
