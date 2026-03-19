import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
export async function POST(request) {
  try {
    const formData = await request.formData()
    const dosya = formData.get('dosya')
    const tur = formData.get('tur') || 'genel'
    const id = formData.get('id') || 'genel'
    if (!dosya || typeof dosya === 'string') return NextResponse.json({ hata: 'Dosya yok' }, { status: 400 })
    const bytes = await dosya.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dosyaAdi = `${Date.now()}_${dosya.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const dir = path.join(process.cwd(), 'public', 'uploads', tur, String(id))
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, dosyaAdi), buffer)
    return NextResponse.json({ basarili: true, url: `/uploads/${tur}/${id}/${dosyaAdi}`, dosyaAdi, boyut: buffer.length })
  } catch(e) { return NextResponse.json({ hata: e.message }, { status: 500 }) }
}
