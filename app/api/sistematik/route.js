import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const konu = searchParams.get('konu') || ''
    const r = await getDb().execute({ sql:`SELECT g.*, a.ad as alim_adi, a.id as alim_id, e.ad as ekol_adi FROM gorusler g LEFT JOIN alimler a ON g.alim_id=a.id LEFT JOIN ekoller e ON a.ekol_id=e.id WHERE g.konu_basligi=? OR g.konu_kategorisi=? ORDER BY e.id, a.vefat_miladi ASC`, args:[konu,konu] })
    return NextResponse.json(r.rows)
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
