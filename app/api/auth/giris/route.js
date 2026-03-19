import { getDb } from '@/lib/db'
import { SignJWT } from 'jose'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'kelam-db-gizli-2024')
export async function POST(request) {
  try {
    const { kullanici_adi, sifre } = await request.json()
    const { rows } = await getDb().execute({ sql:'SELECT * FROM kullanicilar WHERE kullanici_adi=? AND aktif=1', args:[kullanici_adi] })
    const k = rows[0]
    if (!k || !await bcrypt.compare(sifre, k.sifre_hash)) return NextResponse.json({ hata:'Hatali giris' }, { status:401 })
    const token = await new SignJWT({ id:k.id, rol:k.rol, ad:k.ad }).setProtectedHeader({ alg:'HS256' }).setExpirationTime('7d').sign(SECRET)
    const res = NextResponse.json({ basarili:true, kullanici:{ id:k.id, ad:k.ad, rol:k.rol } })
    res.cookies.set('kelam_oturum', token, { httpOnly:true, path:'/', maxAge:604800, sameSite:'strict' })
    return res
  } catch(e) { return NextResponse.json({ hata: e.message }, { status:500 }) }
}
