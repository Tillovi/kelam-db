import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { tur, alim_id, kaynak_id, kaynak_metni, talimat } = await request.json()
    const db = getDb()
    const { rows: alimRows } = await db.execute({ sql:'SELECT * FROM alimler WHERE id=?', args:[alim_id] })
    const alim = alimRows[0]
    if (!alim) return NextResponse.json({ hata: 'Alim bulunamadi' }, { status: 404 })

    const sistemPrompt = `Sen Islami kelam tarihi uzmanisin. Turkce akademik uslupla yaz. Bilgiyi SADECE saglanan kaynak metninden cikar. Her bilgi parcasinin hangi sayfadan geldigini belirt. ISNAD 2 formatinda dipnot ver.`

    let kullaniciPrompt = ''
    if (tur === 'biyografi') {
      kullaniciPrompt = `Alim: ${alim.ad}\nKaynak metni:\n${kaynak_metni || '[Kaynak yok]'}\n\nBu alim icin akademik biyografi yaz. ISNAD 2 dipnotlari ekle.`
    } else if (tur === 'gorus') {
      kullaniciPrompt = `Alim: ${alim.ad}\n${talimat || 'Kelam goruslerini cikar'}\n\nKaynak:\n${kaynak_metni || '[Kaynak yok]'}\n\nGorusleri JSON olarak don: [{"konu_basligi":"...","konu_kategorisi":"...","icerik":"...","kaynak_sayfa":"...","isnad_notu":"..."}]`
    }

    const stream = await client.messages.stream({ model:'claude-opus-4-6', max_tokens:2000, system:sistemPrompt, messages:[{ role:'user', content:kullaniciPrompt }] })
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ metin: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [BITTI]\n\n'))
        controller.close()
      }
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
