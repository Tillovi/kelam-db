// app/api/kaynak-analiz/route.js
// Claude dosyayı okur, kelam verisini ISNAD 2 atıflarıyla çıkarır

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

export const maxDuration = 120 // 2 dakika

export async function POST(request) {
  try {
    const { metin, base64, dosyaAdi, kaynak_bilgisi } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ hata: 'ANTHROPIC_API_KEY eksik' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Mevcut alimleri al — eşleştirme için
    const db = getDb()
    const { rows: mevcutAlimler } = await db.execute(
      'SELECT id, ad, ad_arapca, ad_latinize FROM alimler'
    )
    const alimListesi = mevcutAlimler
      .map(a => `ID:${a.id} | ${a.ad}${a.ad_arapca ? ' / ' + a.ad_arapca : ''}`)
      .join('\n')

    // ISNAD 2 kaynak bilgisi
    const isnadBilgisi = kaynak_bilgisi
      ? `Kaynak: ${kaynak_bilgisi.yazar ? kaynak_bilgisi.yazar + '. ' : ''}${kaynak_bilgisi.baslik}${kaynak_bilgisi.yayin_yili ? ', ' + kaynak_bilgisi.yayin_yili : ''}${kaynak_bilgisi.yayin_yeri ? ', ' + kaynak_bilgisi.yayin_yeri : ''}.`
      : `Kaynak: ${dosyaAdi}`

    const sistemPrompt = `Sen İslam kelam tarihi uzmanısın. Sana verilen akademik metni analiz edip yapılandırılmış veri çıkaracaksın.

Görevin:
1. Metinde geçen kelam alimlerini tespit et
2. Her alim için biyografi bilgisi, görüşleri ve eser bilgilerini çıkar
3. Mevcut veritabanıyla eşleştir — alim zaten varsa ID'sini kullan, yoksa yeni ekle
4. Her bilgi için ISNAD 2 formatında sayfa numarası ver

ISNAD 2 FORMAT: ${isnadBilgisi}
Dipnot örneği: "${kaynak_bilgisi?.yazar?.split(' ').pop() || 'Kaynak'}, ${kaynak_bilgisi?.baslik || dosyaAdi}${kaynak_bilgisi?.yayin_yili ? ', ' + kaynak_bilgisi.yayin_yili : ''}, s. [sayfa]."

Mevcut veritabanındaki alimler:
${alimListesi || '(Veritabanı boş)'}

SADECE JSON döndür, başka hiçbir şey yazma:
{
  "alimler": [
    {
      "veritabani_id": null,
      "ad": "alimin Türkçe adı",
      "ad_arapca": "العربي",
      "vefat_hicri": "300",
      "vefat_miladi": 912,
      "vefat_yeri": "Bağdat",
      "mezhep": "Hanefi",
      "ekol_adi": "Maturidiyye",
      "biyografi": "kısa biyografi metni",
      "biyografi_sayfa": "s. 45",
      "eserler": [
        {
          "ad": "eser adı",
          "ad_arapca": "العربي",
          "tur": "telif",
          "aciklama": "kısa açıklama",
          "sayfa": "s. 67"
        }
      ],
      "gorusler": [
        {
          "konu_basligi": "Teklif-i ma la yuttak",
          "konu_kategorisi": "Ilahiyat",
          "icerik": "görüş metni",
          "kaynak_sayfa": "s. 89",
          "isnad_notu": "tam ISNAD 2 dipnotu"
        }
      ]
    }
  ],
  "ozet": "Metinden ne çıkarıldığının kısa özeti"
}`

    let yanit

    if (base64) {
      // PDF: doğrudan Claude'a gönder
      yanit = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: sistemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              }
            },
            {
              type: 'text',
              text: 'Bu PDF dosyasını analiz et ve sistem talimatına göre JSON çıkar.'
            }
          ]
        }]
      })
    } else {
      // Metin tabanlı
      yanit = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: sistemPrompt,
        messages: [{
          role: 'user',
          content: `Aşağıdaki metni analiz et:\n\n${metin}`
        }]
      })
    }

    const hamMetin = yanit.content[0]?.text || ''

    // JSON çıkar
    let veri
    try {
      const jsonBlogu = hamMetin.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonMetin = jsonBlogu ? jsonBlogu[1].trim() : hamMetin.trim()
      veri = JSON.parse(jsonMetin)
    } catch(e) {
      // JSON bulunamazsa ham metni döndür
      return NextResponse.json({
        basarili: false,
        hata: 'JSON ayrıştırılamadı',
        hamMetin,
      })
    }

    // Veritabanı eşleştirmesi — alim adını karşılaştır
    for (const alim of (veri.alimler || [])) {
      if (!alim.veritabani_id) {
        const eslesme = mevcutAlimler.find(a =>
          a.ad?.toLowerCase() === alim.ad?.toLowerCase() ||
          a.ad_arapca === alim.ad_arapca ||
          a.ad_latinize?.toLowerCase().includes(alim.ad?.toLowerCase())
        )
        if (eslesme) alim.veritabani_id = eslesme.id
      }
    }

    return NextResponse.json({ basarili: true, veri, isnadBilgisi })

  } catch(e) {
    console.error('kaynak-analiz hatası:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
