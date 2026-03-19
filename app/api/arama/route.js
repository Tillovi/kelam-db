import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    if (q.length < 2) return NextResponse.json({ alimler:[], eserler:[], gorusler:[] })
    const db = getDb(); const s = `%${q}%`
    const [ar, er, gr] = await Promise.all([
      db.execute({ sql:'SELECT a.id,a.ad,a.ad_arapca,a.vefat_hicri,a.vefat_miladi,a.vefat_yeri,e.ad as ekol_adi FROM alimler a LEFT JOIN ekoller e ON a.ekol_id=e.id WHERE a.ad LIKE ? OR a.ad_arapca LIKE ? OR a.biyografi LIKE ? LIMIT 20', args:[s,s,s] }),
      db.execute({ sql:'SELECT e.*,a.ad as alim_adi FROM eserler e LEFT JOIN alimler a ON e.alim_id=a.id WHERE e.ad LIKE ? OR e.ad_arapca LIKE ? LIMIT 15', args:[s,s] }),
      db.execute({ sql:'SELECT g.id,g.konu_basligi,g.konu_kategorisi,SUBSTR(g.icerik,1,200) as icerik_ozet,g.alim_id,a.ad as alim_adi,e.ad as ekol_adi FROM gorusler g LEFT JOIN alimler a ON g.alim_id=a.id LEFT JOIN ekoller e ON a.ekol_id=e.id WHERE g.icerik LIKE ? OR g.konu_basligi LIKE ? LIMIT 15', args:[s,s] }),
    ])
    return NextResponse.json({ alimler: ar.rows, eserler: er.rows, gorusler: gr.rows })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
