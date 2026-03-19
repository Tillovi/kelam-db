import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const r = await db.execute({
      sql: 'SELECT a.*, e.ad as ekol_adi, e.renk_kodu as ekol_renk FROM alimler a LEFT JOIN ekoller e ON a.ekol_id = e.id WHERE a.id = ?',
      args: [id]
    })
    if (!r.rows[0]) return NextResponse.json({ hata: 'Bulunamadi' }, { status: 404 })
    return NextResponse.json(r.rows[0])
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}

export async function PUT(request, { params }) {
  try {
    const db = getDb()
    const { id } = await params
    const d = await request.json()
    await db.execute({
      sql: `UPDATE alimler SET ad=?,ad_arapca=?,ad_latinize=?,vefat_hicri=?,vefat_miladi=?,
        dogum_yeri=?,vefat_yeri=?,ekol_id=?,mezhep=?,biyografi=?,enlem=?,boylam=?,
        guncelleme=CURRENT_TIMESTAMP WHERE id=?`,
      args:[d.ad,d.ad_arapca,d.ad_latinize,d.vefat_hicri,d.vefat_miladi,
        d.dogum_yeri,d.vefat_yeri,d.ekol_id,d.mezhep,d.biyografi,d.enlem,d.boylam,id]
    })
    return NextResponse.json({ basarili: true })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
