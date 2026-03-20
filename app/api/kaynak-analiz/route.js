import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

export const maxDuration = 120

function jsonCikar(metin) {
  const yontemler = [
    () => JSON.parse(metin.trim()),
    () => { const m = metin.match(/```(?:json)?\s*([\s\S]+?)```/); if(m) return JSON.parse(m[1].trim()) },
    () => { const b = metin.indexOf('{'), e = metin.lastIndexOf('}'); if(b>=0&&e>b) return JSON.parse(metin.slice(b,e+1)) },
    () => { const b = metin.indexOf('['), e = metin.lastIndexOf(']'); if(b>=0&&e>b) return JSON.parse(metin.slice(b,e+1)) },
  ]
  for (const y of yontemler) { try { const r = y(); if(r) return r } catch {} }
  return null
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

    const metinKirpilmis = metin?.slice(0, 20000) || ''

    // ADIM 1: Sadece alim isimlerini bul (kısa ve hızlı)
    const isimYaniti = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Aşağıdaki metinde geçen İslam alimlerinin isimlerini listele. Sadece JSON array döndür, başka hiçbir şey yazma. Örnek: ["Teftazani","Curcani","Gazali"]

Metin:
${metinKirpilmis.slice(0, 8000)}`
      }]
    })

    const isimMetni = isimYaniti.content[0]?.text?.trim() || ''
    let alimIsimleri = []

    try {
      const parsed = jsonCikar(isimMetni)
      if (Array.isArray(parsed)) alimIsimleri = parsed
      else if (parsed?.alimler) alimIsimleri = parsed.alimler
    } catch {}

    if (alimIsimleri.length === 0) {
      // Manuel regex ile isim çıkarmayı dene
      const satırlar = isimMetni.split('\n').filter(s => s.trim().length > 2)
      alimIsimleri = satırlar.map(s => s.replace(/^[-•*\d.]+\s*/, '').trim()).filter(s => s.length > 2).slice(0, 20)
    }

    if (alimIsimleri.length === 0) {
      return NextResponse.json({
        basarili: false,
        hata: 'Metinde alim ismi bulunamadı. Dosyanın kelam alimlerini içerdiğinden emin olun.',
        hamMetin: isimMetni
      })
    }

    // ADIM 2: Her alim için ayrı ayrı detay çıkar (max 10 alim)
    const alimleriIsle = alimIsimleri.slice(0, 10)
    const sonucAlimler = []

    for (const alimAdi of alimleriIsle) {
      try {
        const detayYaniti = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Kaynak: ${kaynakKunye}
Alim: ${alimAdi}

Aşağıdaki metinden "${alimAdi}" hakkındaki bilgileri çıkar. SADECE JSON döndür:
{"ad":"${alimAdi}","ad_arapca":"","vefat_hicri":"","vefat_miladi":0,"vefat_yeri":"","ekol_adi":"","biyografi":"","eserler":[{"ad":"","tur":"telif","aciklama":""}],"gorusler":[{"konu_basligi":"","konu_kategorisi":"Ilahiyat","icerik":"","kaynak_sayfa":"","isnad_notu":""}]}

Bilgi yoksa ilgili alanı boş bırak. Metin:
${metinKirpilmis.slice(0, 6000)}`
          }]
        })

        const detayMetni = detayYaniti.content[0]?.text?.trim() || ''
        const detay = jsonCikar(detayMetni)

        if (detay && detay.ad) {
          // Boş dizileri temizle
          detay.eserler = (detay.eserler || []).filter(e => e.ad && e.ad.trim())
          detay.gorusler = (detay.gorusler || []).filter(g => g.icerik && g.icerik.trim())

          // ISNAD notu ekle
          detay.gorusler.forEach(g => {
            if (!g.isnad_notu && g.kaynak_sayfa) {
              g.isnad_notu = `${kaynakKunye}, ${g.kaynak_sayfa}.`
            }
          })

          // Veritabanı eşleştirme
          const eslesme = mevcutAlimler.find(a =>
            a.ad?.toLowerCase().includes(alimAdi.toLowerCase()) ||
            alimAdi.toLowerCase().includes(a.ad?.toLowerCase() || '') ||
            a.ad_arapca === detay.ad_arapca
          )
          if (eslesme) detay.veritabani_id = eslesme.id
          else detay.veritabani_id = null

          sonucAlimler.push(detay)
        }
      } catch(e) {
        console.error(`${alimAdi} işlenirken hata:`, e.message)
      }
    }

    if (sonucAlimler.length === 0) {
      return NextResponse.json({
        basarili: false,
        hata: 'Alimler tespit edildi ama detay çıkarılamadı. Farklı bir metin bölümü deneyin.',
      })
    }

    const toplamGorus = sonucAlimler.reduce((t, a) => t + (a.gorusler?.length || 0), 0)
    const toplamEser = sonucAlimler.reduce((t, a) => t + (a.eserler?.length || 0), 0)

    return NextResponse.json({
      basarili: true,
      veri: {
        alimler: sonucAlimler,
        ozet: `${sonucAlimler.length} alim, ${toplamGorus} görüş, ${toplamEser} eser tespit edildi. Kaynak: ${kaynakKunye}`
      }
    })

  } catch(e) {
    console.error('kaynak-analiz:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
