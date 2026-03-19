import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'kelam-db-gizli-2024')
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('kelam_oturum')?.value
    if (!token) return NextResponse.json({ girisYapilmis: false })
    const { payload } = await jwtVerify(token, SECRET)
    return NextResponse.json({ girisYapilmis: true, kullanici: { id: payload.id, ad: payload.ad, rol: payload.rol } })
  } catch { return NextResponse.json({ girisYapilmis: false }) }
}
