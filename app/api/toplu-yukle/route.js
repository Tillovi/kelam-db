import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function POST(request) {
  try {
    const { satirlar } = await request.json()
    const db = getDb()
    const { rows: er } = await db.execute('SELECT id, ad FROM ekoller')
    const ekolMap = {}; er.forEach(e => { ekolMap[e.ad.toLowerCase()] = e.id })
    let eklenen = 0, atlanan = 0
    for (const s of satirlar) {
      if (!s.ad) { atlanan++; continue }
      const { rows: vr } = await db.execute({ sql:'SELECT id FROM alimler WHERE ad=?', args:[s.ad.trim()] })
      if (vr.length > 0) { atlanan++; continue }
      const ekolId = s.ekol_adi ? (ekolMap[s.ekol_adi.toLowerCase()]||null) : null
      await db.execute({ sql:'INSERT INTO alimler (ad,ad_arapca,ad_latinize,vefat_hicri,vefat_miladi,dogum_yeri,vefat_yeri,ekol_id,mezhep,biyografi,enlem,boylam) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args:[s.ad?.trim()||'',s.ad_arapca||null,s.ad_latinize||null,s.vefat_hicri?.toString()||null,s.vefat_miladi?parseInt(s.vefat_miladi):null,s.dogum_yeri||null,s.vefat_yeri||null,ekolId,s.mezhep||null,s.biyografi||null,s.enlem?parseFloat(s.enlem):null,s.boylam?parseFloat(s.boylam):null] })
      eklenen++
    }
    return NextResponse.json({ basarili:true, eklenen, atlanan })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
