import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

export const maxDuration = 120

export async function POST(request) {
  try {
    const { metin, base64, dosyaAdi, kaynak_bilgisi } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ hata: 'ANTHROPIC_API_KEY eksik' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const db = getDb()
    const { rows: mevcutAlimler } = await db.execute('SELECT id, ad, ad_arapca FROM alimler')
    const alimListesi = mevcutAlimler.map(a => `ID:${a.id}=${a.ad}`).join(', ')

    const kaynakKunye = kaynak_bilgisi
      ? `${kaynak_bilgisi.yazar ? kaynak_bilgisi.yazar + ', ' : ''}${kaynak_bilgisi.baslik}${kaynak_bilgisi.yayin_yili ? ', ' + kaynak_bilgisi.yayin_yili : ''}${kaynak_bilgisi.yayin_yeri ? ', ' + kaynak_bilgisi.yayin_yeri : ''}`
      : dosyaAdi

    const sistemPrompt = `Sen İslam kelam tarihi uzmanısın. Verilen metinden alim bilgilerini çıkarıp SADECE JSON formatında döndüreceksin.

KURAL: Yanıtın { ile başlamalı ve } ile bitmeli. Başka hiçbir şey yazma.

Mevcut alimler (eşleştirme için): ${alimListesi || 'boş'}
Kaynak künye: ${kaynakKunye}

JSON şablonu:
{"alimler":[{"veritabani_id":null,"ad":"Türkçe ad","ad_arapca":"عربي","vefat_hicri":"300","vefat_miladi":912,"vefat_yeri":"şehir","ekol_adi":"Maturidiyye","biyografi":"kısa biyografi","biyografi_sayfa":"s.45","eserler":[{"ad":"eser adı","ad_arapca":"عربي","tur":"telif","aciklama":"açıklama"}],"gorusler":[{"konu_basligi":"konu","konu_kategorisi":"Ilahiyat","icerik":"görüş metni","kaynak_sayfa":"s.89","isnad_notu":"${kaynakKunye}, s.89."}]}],"ozet":"kısa özet"}`

    const icerik = base64
      ? [{ type:'document', source:{ type:'base64', media_type:'application/pdf', data:base64 } }, { type:'text', text:'Bu belgeyi analiz et ve JSON döndür.' }]
      : `Aşağıdaki metni analiz et:\n\n${metin?.slice(0, 15000) || ''}`

    const yanit = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: sistemPrompt,
      messages: [{ role: 'user', content: icerik }]
    })

    const hamMetin = yanit.content[0]?.text?.trim() || ''
    console.log('Claude yanıtı (ilk 200):', hamMetin.slice(0, 200))

    // JSON çıkarma — birden fazla yöntem dene
    let veri = null
    const yontemler = [
      // 1. Doğrudan parse
      () => JSON.parse(hamMetin),
      // 2. Kod bloğu içinden
      () => { const m = hamMetin.match(/```(?:json)?\s*([\s\S]+?)```/); if(m) return JSON.parse(m[1].trim()) },
      // 3. İlk { ... } bloğu
      () => { const bas = hamMetin.indexOf('{'); const bit = hamMetin.lastIndexOf('}'); if(bas>=0&&bit>bas) return JSON.parse(hamMetin.slice(bas,bit+1)) },
      // 4. Boş şablon döndür
      () => ({ alimler: [], ozet: 'Metinden alim bilgisi çıkarılamadı.' })
    ]

    for (const yontem of yontemler) {
      try { veri = yontem(); if(veri) break } catch {}
    }

    if (!veri) {
      return NextResponse.json({ basarili: false, hata: 'JSON üretilemedi', hamMetin })
    }

    // Veritabanı eşleştirme
    for (const alim of (veri.alimler || [])) {
      if (!alim.veritabani_id) {
        const eslesme = mevcutAlimler.find(a =>
          a.ad?.toLowerCase() === alim.ad?.toLowerCase() ||
          a.ad_arapca === alim.ad_arapca
        )
        if (eslesme) alim.veritabani_id = eslesme.id
      }
    }

    return NextResponse.json({ basarili: true, veri })

  } catch(e) {
    console.error('kaynak-analiz:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
