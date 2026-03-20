// app/api/kaynak-kaydet/route.js
// Onaylanan analiz sonuçlarını veritabanına kaydeder

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function n(v) { return (v === '' || v === undefined || v === null) ? null : String(v) }
function ni(v) { const p = parseInt(v); return isNaN(p) ? null : p }

export async function POST(request) {
  try {
    const { alimler, kaynak_id, secilen } = await request.json()
    // secilen: { alim_index: true/false } — hangi alimler kaydedilecek

    const db = getDb()

    // Ekol adından ID bul
    const { rows: ekolRows } = await db.execute('SELECT id, ad FROM ekoller')
    const ekolMap = {}
    ekolRows.forEach(e => { ekolMap[e.ad?.toLowerCase()] = e.id })

    const sonuclar = {
      eklenenAlimler: 0,
      guncellenenAlimler: 0,
      eklenenGorusler: 0,
      eklenenEserler: 0,
      atlanalar: [],
    }

    for (let i = 0; i < alimler.length; i++) {
      if (secilen && !secilen[i]) continue // seçilmemiş

      const alim = alimler[i]
      let alimId = alim.veritabani_id

      const ekolId = alim.ekol_adi ? (ekolMap[alim.ekol_adi.toLowerCase()] || null) : null

      if (alimId) {
        // Mevcut alimi güncelle — sadece biyografi güncelleniyorsa diğer alanları korur
        if (alim.biyografi) {
          const { rows: mevcut } = await db.execute({
            sql: 'SELECT biyografi FROM alimler WHERE id=?',
            args: [alimId]
          })
          const mevcutBio = mevcut[0]?.biyografi || ''
          const yeniBio = mevcutBio
            ? mevcutBio + '\n\n[Ek kaynak: ' + alim.biyografi_sayfa + ']\n' + alim.biyografi
            : alim.biyografi

          await db.execute({
            sql: 'UPDATE alimler SET biyografi=?, guncelleme=CURRENT_TIMESTAMP WHERE id=?',
            args: [n(yeniBio), alimId]
          })
          sonuclar.guncellenenAlimler++
        }
      } else {
        // Yeni alim ekle
        const { lastInsertRowid } = await db.execute({
          sql: `INSERT INTO alimler
            (ad, ad_arapca, vefat_hicri, vefat_miladi, vefat_yeri, mezhep, ekol_id, biyografi)
            VALUES (?,?,?,?,?,?,?,?)`,
          args: [
            n(alim.ad), n(alim.ad_arapca),
            n(alim.vefat_hicri), ni(alim.vefat_miladi),
            n(alim.vefat_yeri), n(alim.mezhep),
            ekolId, n(alim.biyografi)
          ]
        })
        alimId = Number(lastInsertRowid)
        sonuclar.eklenenAlimler++
      }

      // Eserleri ekle
      for (const eser of (alim.eserler || [])) {
        // Aynı isimde eser var mı kontrol et
        const { rows: varMi } = await db.execute({
          sql: 'SELECT id FROM eserler WHERE ad=? AND alim_id=?',
          args: [n(eser.ad), alimId]
        })
        if (varMi.length === 0) {
          await db.execute({
            sql: 'INSERT INTO eserler (ad, ad_arapca, alim_id, tur, aciklama, isnad_bilgisi) VALUES (?,?,?,?,?,?)',
            args: [
              n(eser.ad), n(eser.ad_arapca), alimId,
              n(eser.tur) || 'telif', n(eser.aciklama),
              n(eser.isnad_notu)
            ]
          })
          sonuclar.eklenenEserler++
        }
      }

      // Görüşleri ekle
      for (const gorus of (alim.gorusler || [])) {
        // Aynı konu başlığında aynı alime ait görüş var mı
        const { rows: varMi } = await db.execute({
          sql: 'SELECT id FROM gorusler WHERE alim_id=? AND konu_basligi=?',
          args: [alimId, n(gorus.konu_basligi)]
        })
        if (varMi.length === 0) {
          await db.execute({
            sql: `INSERT INTO gorusler
              (alim_id, konu_basligi, konu_kategorisi, icerik, kaynak_id, kaynak_sayfa, isnad_notu)
              VALUES (?,?,?,?,?,?,?)`,
            args: [
              alimId, n(gorus.konu_basligi), n(gorus.konu_kategorisi),
              n(gorus.icerik), kaynak_id || null,
              n(gorus.kaynak_sayfa), n(gorus.isnad_notu)
            ]
          })
          sonuclar.eklenenGorusler++
        } else {
          sonuclar.atlanalar.push(`${alim.ad}: "${gorus.konu_basligi}" zaten mevcut`)
        }
      }
    }

    return NextResponse.json({ basarili: true, sonuclar })

  } catch(e) {
    console.error('kaynak-kaydet hatası:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
