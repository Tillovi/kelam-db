import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

function n(v) { return (v === '' || v === undefined || v === null) ? null : String(v) }
function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }
function nf(v) { const p = parseFloat(v); return isNaN(p) ? null : p }

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const r = await getDb().execute({
      sql: 'SELECT a.*, e.ad as ekol_adi, e.renk_kodu as ekol_renk FROM alimler a LEFT JOIN ekoller e ON a.ekol_id = e.id WHERE a.id = ?',
      args: [id]
    })
    if (!r.rows[0]) return NextResponse.json({ hata: 'Bulunamadi' }, { status: 404 })
    return NextResponse.json(r.rows[0])
  } catch(e) {
    console.error('GET alim:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const d = await request.json()
    const db = getDb()

    // Sadece biyografi güncelleniyorsa
    if (Object.keys(d).length === 1 && 'biyografi' in d) {
      await db.execute({
        sql: 'UPDATE alimler SET biyografi=?, guncelleme=CURRENT_TIMESTAMP WHERE id=?',
        args: [n(d.biyografi), id]
      })
      return NextResponse.json({ basarili: true })
    }

    // Tam güncelleme
    await db.execute({
      sql: `UPDATE alimler SET
        ad=?, ad_arapca=?, ad_latinize=?,
        vefat_hicri=?, vefat_miladi=?,
        dogum_yeri=?, vefat_yeri=?,
        ekol_id=?, mezhep=?, biyografi=?,
        enlem=?, boylam=?,
        guncelleme=CURRENT_TIMESTAMP
        WHERE id=?`,
      args: [
        n(d.ad), n(d.ad_arapca), n(d.ad_latinize),
        n(d.vefat_hicri), ni(d.vefat_miladi),
        n(d.dogum_yeri), n(d.vefat_yeri),
        ni(d.ekol_id), n(d.mezhep), n(d.biyografi),
        nf(d.enlem), nf(d.boylam),
        id
      ]
    })
    return NextResponse.json({ basarili: true })
  } catch(e) {
    console.error('PUT alim hatasi:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
