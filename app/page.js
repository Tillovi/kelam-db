'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EKOL = {
  'Maturidiyye':'bg-purple-100 text-purple-800',
  "Es'ariyye":'bg-emerald-100 text-emerald-800',
  "Mu'tezile":'bg-amber-100 text-amber-800',
  'Zeydiyye':'bg-red-100 text-red-800',
  'Imamiyye':'bg-blue-100 text-blue-800',
  'Selefiyye':'bg-gray-100 text-gray-700',
}

export default function AnaSayfa() {
  const router = useRouter()
  const [arama, setArama] = useState('')
  const [secilenEkol, setSecilenEkol] = useState('')
  const [alimler, setAlimler] = useState([])
  const [ekoller, setEkoller] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/alim').then(r => r.json()),
      fetch('/api/ekol').then(r => r.json()),
    ]).then(([a, e]) => {
      if (Array.isArray(a)) setAlimler(a); else setHata(a.hata || 'API hatası')
      if (Array.isArray(e)) setEkoller(e)
      setYukleniyor(false)
    }).catch(e => { setHata(e.message); setYukleniyor(false) })
  }, [])

  const filtrelenmis = alimler.filter(a => {
    const ad = !arama || a.ad?.toLowerCase().includes(arama.toLowerCase()) || a.ad_arapca?.includes(arama)
    const ek = !secilenEkol || a.ekol_adi === secilenEkol
    return ad && ek
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Kelam alimleri</h1>
        <p className="text-sm text-gray-500">İslam kelam tarihi veritabanı</p>
      </div>

      <div className="flex gap-2 mb-4">
        <input type="text" value={arama} onChange={e => setArama(e.target.value)}
          placeholder="Alim adı veya Arapça ad..."
          className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white" />
        <a href="/arama" className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap">Gelişmiş arama</a>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setSecilenEkol('')}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${!secilenEkol ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}>
          Tümü
        </button>
        {ekoller.map(e => (
          <button key={e.id} onClick={() => setSecilenEkol(secilenEkol === e.ad ? '' : e.ad)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${secilenEkol === e.ad ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}>
            {e.ad}
          </button>
        ))}
      </div>

      {hata && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">Hata: {hata}</div>}

      {yukleniyor ? (
        <div className="text-sm text-gray-400 text-center py-12">Yükleniyor...</div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">{filtrelenmis.length} alim</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrelenmis.map(a => (
              <div key={a.id} onClick={() => router.push(`/alim/${a.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.ad}</p>
                    {a.ad_arapca && <p className="text-xs text-gray-400 arabic mt-0.5">{a.ad_arapca}</p>}
                  </div>
                  {a.ekol_adi && <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${EKOL[a.ekol_adi] || 'bg-gray-100 text-gray-700'}`}>{a.ekol_adi}</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {a.vefat_hicri && `ö. ${a.vefat_hicri}/${a.vefat_miladi}`}
                  {a.vefat_yeri && ` · ${a.vefat_yeri}`}
                  {a.mezhep && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{a.mezhep}</span>}
                </p>
              </div>
            ))}
            {filtrelenmis.length === 0 && <p className="col-span-3 text-sm text-gray-400 text-center py-12">Sonuç yok.</p>}
          </div>
        </>
      )}
    </div>
  )
}
