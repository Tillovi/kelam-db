import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

export const maxDuration = 120

function jsonCikar(metin) {
  const yontemler = [
    () => JSON.parse(metin.trim()),
    () => { const m = metin.match(/```(?:json)?\s*([\s\S]+?)```/); if(m) return JSON.parse(m[1].trim()) },
    () => { const b = metin.indexOf('{'), e = metin.lastIndexOf('}'); if(b>=0&&e>b) return JSON.parse(metin.slice(b,e+1)) },
  ]
  for (const y of yontemler) { try { const r = y(); if(r) return r } catch {} }
  return null
}

// Metinden alimin geçtiği bölümü bul
function alimBolumuBul(metin, alimAdi) {
  if (!metin) return ''
  const adParcalari = alimAdi.split(/[\s,._-]+/).filter(p => p.length > 3)
  let enIyiKonum = -1

  for (const parca of adParcalari) {
    const konum = metin.toLowerCase().indexOf(parca.toLowerCase())
    if (konum !== -1) {
      enIyiKonum = konum
      break
    }
  }

  if (enIyiKonum === -1) return metin.slice(0, 4000)

  // Alimin geçtiği bölümün etrafını al (2000 karakter önce, 4000 sonra)
  const bas = Math.max(0, enIyiKonum - 2000)
  const bit = Math.min(metin.length, enIyiKonum + 4000)
  return metin.slice(bas, bit)
}

export async function POST(request) {
  try {
    const { metin, base64, dosyaAdi, kaynak_bilgisi } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ hata: 'ANTHROPIC_API_KEY eksik' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const db = getDb()
    const { rows: mevcutAlimler } = await db.execute('SELECT id, ad, ad_arapca FROM alimler')

    const kaynakKunye = kaynak_bilgisi
      ? `${kaynak_bilgisi.yazar ? kaynak_bilgisi.yazar + ', ' : ''}${kaynak_bilgisi.baslik}${kaynak_bilgisi.yayin_yili ? ', ' + kaynak_bilgisi.yayin_yili : ''}`
      : dosyaAdi

    const tamMetin = metin || ''

    // ADIM 1: Alim isimlerini bul
    const isimYaniti = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Bu metinde geçen İslam alimlerinin isimlerini JSON array olarak ver. Sadece ["isim1","isim2"] formatında yaz, başka hiçbir şey ekleme.\n\nMetin:\n${tamMetin.slice(0, 10000)}`
      }]
    })

    const isimMetni = isimYaniti.content[0]?.text?.trim() || ''
    let alimIsimleri = []

    try {
      const parsed = jsonCikar(isimMetni)
      if (Array.isArray(parsed)) alimIsimleri = parsed
    } catch {}

    // Fallback: satır satır oku
    if (alimIsimleri.length === 0) {
      alimIsimleri = isimMetni
        .split('\n')
        .map(s => s.replace(/^[-•*"\d.[\]]+\s*/,'').replace(/[",\]]+$/,'').trim())
        .filter(s => s.length > 3 && s.length < 60)
        .slice(0, 15)
    }

    if (alimIsimleri.length === 0) {
      return NextResponse.json({
        basarili: false,
        hata: 'Metinde alim ismi bulunamadı. Dosyanın İslam alimleri hakkında bilgi içerdiğinden emin olun.',
      })
    }

    // ADIM 2: Her alim için ilgili metin bölümünü analiz et
    const sonucAlimler = []

    for (const alimAdi of alimIsimleri.slice(0, 8)) {
      try {
        // Bu alimin geçtiği metni bul
        const alimMetni = alimBolumuBul(tamMetin, alimAdi)

        const detayYaniti = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Kaynak: ${kaynakKunye}
Alim adı: "${alimAdi}"

Aşağıdaki metin bölümünden bu alim hakkındaki bilgileri çıkar. Bilgi varsa doldur, yoksa boş string bırak.
SADECE JSON yaz, açıklama ekleme:

{"ad":"${alimAdi}","ad_arapca":"","vefat_hicri":"","vefat_miladi":0,"vefat_yeri":"","dogum_yeri":"","ekol_adi":"","mezhep":"","biyografi":"","eserler":[{"ad":"","ad_arapca":"","tur":"telif","aciklama":""}],"gorusler":[{"konu_basligi":"","konu_kategorisi":"Ilahiyat","icerik":"","kaynak_sayfa":"","isnad_notu":"${kaynakKunye}, s.??."}]}

Metin bölümü:
${alimMetni}`
          }]
        })

        const detayMetni = detayYaniti.content[0]?.text?.trim() || ''
        const detay = jsonCikar(detayMetni)

        if (detay) {
          // Boş kayıtları temizle
          detay.eserler = (detay.eserler||[]).filter(e => e.ad?.trim())
          detay.gorusler = (detay.gorusler||[]).filter(g => g.icerik?.trim())

          // ISNAD notu güncelle
          detay.gorusler.forEach(g => {
            if (!g.isnad_notu?.includes(kaynakKunye)) {
              g.isnad_notu = `${kaynakKunye}${g.kaynak_sayfa ? ', ' + g.kaynak_sayfa : ''}.`
            }
          })

          // Veritabanı eşleştir
          const eslesme = mevcutAlimler.find(a =>
            a.ad?.toLowerCase().includes(alimAdi.toLowerCase()) ||
            alimAdi.toLowerCase().includes((a.ad||'').toLowerCase())
          )
          detay.veritabani_id = eslesme ? eslesme.id : null

          sonucAlimler.push(detay)
        }
      } catch(e) {
        console.error(`${alimAdi} hatası:`, e.message)
      }
    }

    if (sonucAlimler.length === 0) {
      return NextResponse.json({
        basarili: false,
        hata: 'Alimler bulundu ama metin bölümlerinden detay çıkarılamadı. Daha az alim içeren kısa bir metin deneyin.',
      })
    }

    const toplamGorus = sonucAlimler.reduce((t, a) => t + (a.gorusler?.length||0), 0)
    const toplamEser  = sonucAlimler.reduce((t, a) => t + (a.eserler?.length||0), 0)

    return NextResponse.json({
      basarili: true,
      veri: {
        alimler: sonucAlimler,
        ozet: `${sonucAlimler.length} alim · ${toplamGorus} görüş · ${toplamEser} eser tespit edildi`
      }
    })

  } catch(e) {
    console.error('kaynak-analiz:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
