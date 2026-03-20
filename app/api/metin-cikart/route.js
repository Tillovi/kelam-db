// app/api/metin-cikart/route.js
// Yüklenen dosyadan metin çıkarır

import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request) {
  try {
    const formData = await request.formData()
    const dosya = formData.get('dosya')

    if (!dosya || typeof dosya === 'string') {
      return NextResponse.json({ hata: 'Dosya bulunamadı' }, { status: 400 })
    }

    const bytes = await dosya.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dosyaAdi = dosya.name.toLowerCase()
    const boyut = buffer.length

    // Boyut kontrolü (10MB max)
    if (boyut > 10 * 1024 * 1024) {
      return NextResponse.json({ hata: 'Dosya çok büyük (max 10MB)' }, { status: 400 })
    }

    let metin = ''
    let tur = ''

    if (dosyaAdi.endsWith('.txt') || dosyaAdi.endsWith('.md')) {
      // Düz metin
      metin = buffer.toString('utf-8')
      tur = 'txt'
    } else if (dosyaAdi.endsWith('.pdf')) {
      // PDF: base64 olarak Claude'a gönderilecek
      const base64 = buffer.toString('base64')
      return NextResponse.json({
        basarili: true,
        tur: 'pdf',
        base64,
        dosyaAdi: dosya.name,
        boyut,
        metin: null, // PDF için metin Claude tarafında çıkarılacak
      })
    } else if (dosyaAdi.endsWith('.docx')) {
      // DOCX: basit XML çıkarma
      try {
        const { Readable } = await import('stream')
        // DOCX aslında ZIP — word/document.xml içeriğini çıkar
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)
        const docXml = await zip.file('word/document.xml')?.async('text')
        if (docXml) {
          // XML etiketlerini temizle
          metin = docXml
            .replace(/<w:p[ >]/g, '\n<w:p>')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
        }
        tur = 'docx'
      } catch(e) {
        return NextResponse.json({ hata: 'DOCX okunamadı: ' + e.message }, { status: 400 })
      }
    } else {
      return NextResponse.json({ hata: 'Desteklenmeyen dosya türü. PDF, DOCX veya TXT kullanın.' }, { status: 400 })
    }

    if (!metin && tur !== 'pdf') {
      return NextResponse.json({ hata: 'Dosyadan metin çıkarılamadı' }, { status: 400 })
    }

    // Çok uzunsa kırp (Claude ~100k token sınırı var)
    const maxKarakter = 20000
    const kirpildi = metin.length > maxKarakter
    if (kirpildi) metin = metin.slice(0, maxKarakter)

    return NextResponse.json({
      basarili: true,
      tur,
      metin,
      dosyaAdi: dosya.name,
      boyut,
      kirpildi,
      karakterSayisi: metin.length,
    })

  } catch(e) {
    console.error('metin-cikart hatası:', e)
    return NextResponse.json({ hata: e.message }, { status: 500 })
  }
}
