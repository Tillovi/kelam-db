import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const ekol = searchParams.get('ekol') || ''
    let sql = `SELECT a.*, e.ad as ekol_adi, e.renk_kodu as ekol_renk
      FROM alimler a LEFT JOIN ekoller e ON a.ekol_id = e.id WHERE 1=1`
    const args = []
    if (q) { sql += ' AND (a.ad LIKE ? OR a.ad_arapca LIKE ? OR a.ad_latinize LIKE ?)'; args.push(`%${q}%`,`%${q}%`,`%${q}%`) }
    if (ekol) { sql += ' AND e.ad = ?'; args.push(ekol) }
    sql += ' ORDER BY a.vefat_miladi ASC'
    const r = await db.execute({ sql, args })
    return NextResponse.json(r.rows)
  } catch(e) {
    console.error('GET /api/alim:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const db = getDb()
    const d = await request.json()
    const r = await db.execute({
      sql: `INSERT INTO alimler (ad,ad_arapca,ad_latinize,lakap,vefat_hicri,vefat_miladi,
        dogum_hicri,dogum_miladi,dogum_yeri,vefat_yeri,ekol_id,mezhep,biyografi,enlem,boylam)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args:[d.ad,d.ad_arapca,d.ad_latinize,d.lakap,d.vefat_hicri,d.vefat_miladi,
        d.dogum_hicri,d.dogum_miladi,d.dogum_yeri,d.vefat_yeri,d.ekol_id,d.mezhep,d.biyografi,d.enlem,d.boylam]
    })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) {
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
