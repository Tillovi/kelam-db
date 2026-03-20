import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

export const maxDuration = 60 // Vercel max timeout

export async function POST(request) {
  try {
    const { tur, alim_id, kaynak_metni, talimat } = await request.json()

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ hata: 'ANTHROPIC_API_KEY tanimli degil' }, { status: 500 })
    }

    const db = getDb()
    const { rows } = await db.execute({ sql: 'SELECT * FROM alimler WHERE id=?', args: [alim_id] })
    const alim = rows[0]
    if (!alim) return NextResponse.json({ hata: 'Alim bulunamadi' }, { status: 404 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const sistemPrompt = `Sen Islami kelam tarihi uzmanisin. Turkce akademik uslupla yaz. Bilgiyi SADECE saglanan kaynak metninden cikar. ISNAD 2 formatinda dipnot ver: Yazar, Eser, Sehir Yil, s. XX.`

    let kullaniciPrompt = ''
    if (tur === 'biyografi') {
      kullaniciPrompt = `Alim: ${alim.ad}\n\nAşağıdaki kaynak metnini kullanarak bu alim için akademik biyografi yaz. ISNAD 2 dipnotları ekle.\n\nKaynak:\n${kaynak_metni || '[Kaynak metni girilmedi - genel bilgiyle devam et]'}`
    } else if (tur === 'gorus') {
      kullaniciPrompt = `Alim: ${alim.ad}\n${talimat || 'Kelam goruslerini cikar'}\n\nKaynak:\n${kaynak_metni || '[Kaynak yok]'}\n\nGorusleri JSON olarak don (sadece JSON, baska bir sey yazma):\n[{"konu_basligi":"...","konu_kategorisi":"...","icerik":"...","kaynak_sayfa":"...","isnad_notu":"..."}]`
    } else {
      kullaniciPrompt = `Asagidaki metni ozetle:\n${kaynak_metni}`
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: sistemPrompt,
      messages: [{ role: 'user', content: kullaniciPrompt }],
    })

    const metin = message.content[0]?.text || ''
    return NextResponse.json({ basarili: true, metin })

  } catch(e) {
    console.error('ai-uret hatasi:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
