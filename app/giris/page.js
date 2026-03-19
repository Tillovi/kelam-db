'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GirisSayfa() {
  const router = useRouter()
  const [form, setForm] = useState({ kullanici_adi: '', sifre: '' })
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function gonder(e) {
    e.preventDefault()
    setHata('')
    setYukleniyor(true)

    const r = await fetch('/api/auth/giris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()

    if (d.basarili) {
      router.push('/admin')
      router.refresh()
    } else {
      setHata(d.hata || 'Giriş başarısız')
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Admin girişi</h1>
          <p className="text-sm text-gray-500 mt-1 arabic">مصادر علم الكلام</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {hata && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {hata}
            </div>
          )}

          <form onSubmit={gonder} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kullanıcı adı</label>
              <input
                type="text"
                value={form.kullanici_adi}
                onChange={e => setForm(f => ({ ...f, kullanici_adi: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="admin"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Şifre</label>
              <input
                type="password"
                value={form.sifre}
                onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            İlk giriş: <code className="bg-gray-100 px-1 rounded">admin / kelam2024</code>
          </p>
        </div>
      </div>
    </div>
  )
}
