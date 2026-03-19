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
    console.error('GET /api/alim hatasi:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}

// Boş string → null dönüşümü
function n(v) { return (v === '' || v === undefined) ? null : v }
function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }
function nf(v) { const p = parseFloat(v); return isNaN(p) ? null : p }

export async function POST(request) {
  try {
    const db = getDb()
    const d = await request.json()
    console.log('POST /api/alim:', JSON.stringify(d))

    const r = await db.execute({
      sql: `INSERT INTO alimler
        (ad, ad_arapca, ad_latinize, lakap,
         vefat_hicri, vefat_miladi, dogum_hicri, dogum_miladi,
         dogum_yeri, vefat_yeri, ekol_id, mezhep, biyografi, enlem, boylam)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        n(d.ad), n(d.ad_arapca), n(d.ad_latinize), n(d.lakap),
        n(d.vefat_hicri), ni(d.vefat_miladi), n(d.dogum_hicri), ni(d.dogum_miladi),
        n(d.dogum_yeri), n(d.vefat_yeri), ni(d.ekol_id), n(d.mezhep),
        n(d.biyografi), nf(d.enlem), nf(d.boylam)
      ]
    })
    return NextResponse.json({ id: Number(r.lastInsertRowid), basarili: true })
  } catch(e) {
    console.error('POST /api/alim hatasi:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
