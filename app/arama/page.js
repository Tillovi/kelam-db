'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const EKOL_RENK = {
  'Maturidiyye': 'bg-purple-100 text-purple-800',
  "Es'ariyye":   'bg-emerald-100 text-emerald-800',
  "Mu'tezile":   'bg-amber-100 text-amber-800',
  'Zeydiyye':    'bg-red-100 text-red-800',
  'Imamiyye':    'bg-blue-100 text-blue-800',
  'Selefiyye':   'bg-gray-100 text-gray-700',
}

function AramaSayfaIc() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ]           = useState(searchParams.get('q') || '')
  const [tur, setTur]       = useState(searchParams.get('tur') || 'tumu')
  const [ekol, setEkol]     = useState(searchParams.get('ekol') || '')
  const [sonuclar, setSonuclar] = useState({ alimler: [], eserler: [], gorusler: [] })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [ekoller, setEkoller] = useState([])

  useEffect(() => {
    fetch('/api/ekol').then(r => r.json()).then(setEkoller)
  }, [])

  const ara = useCallback(async (sorgu, turParam, ekolParam) => {
    if (!sorgu || sorgu.length < 2) { setSonuclar({ alimler: [], eserler: [], gorusler: [] }); return }
    setYukleniyor(true)
    const r = await fetch(`/api/arama?q=${encodeURIComponent(sorgu)}&tur=${turParam}&ekol=${ekolParam}`)
    const d = await r.json()
    setSonuclar(d)
    setYukleniyor(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => ara(q, tur, ekol), 300)
    return () => clearTimeout(t)
  }, [q, tur, ekol, ara])

  const toplamSonuc = (sonuclar.alimler?.length || 0) +
    (sonuclar.eserler?.length || 0) + (sonuclar.gorusler?.length || 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Gelişmiş arama</h1>
        <p className="text-sm text-gray-500">Alim, eser ve görüş içinde tam metin arama · Arapça destekli</p>
      </div>

      {/* Arama kutusu */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Türkçe veya Arapça arama yapın... الماتريدي · teklif · serh"
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          autoFocus
          dir="auto"
        />

        <div className="flex gap-2 mt-3 flex-wrap items-center">
          {/* Tür filtresi */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
            {[
              { val: 'tumu', label: 'Tümü' },
              { val: 'alim', label: 'Alimler' },
              { val: 'eser', label: 'Eserler' },
              { val: 'gorus', label: 'Görüşler' },
            ].map(t => (
              <button key={t.val} onClick={() => setTur(t.val)}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${tur === t.val ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Ekol filtresi */}
          <select value={ekol} onChange={e => setEkol(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-600 focus:outline-none">
            <option value="">Tüm ekoller</option>
            {ekoller.map(e => <option key={e.id} value={e.ad}>{e.ad}</option>)}
          </select>

          {q.length >= 2 && (
            <span className="text-xs text-gray-400 ml-auto">
              {yukleniyor ? 'Aranıyor...' : `${toplamSonuc} sonuç`}
            </span>
          )}
        </div>
      </div>

      {/* Sonuçlar */}
      {q.length >= 2 && !yukleniyor && (
        <div className="space-y-6">
          {/* Alimler */}
          {sonuclar.alimler?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Alimler ({sonuclar.alimler.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sonuclar.alimler.map(a => (
                  <a key={a.id} href={`/alim/${a.id}`}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.ad}</p>
                        {a.ad_arapca && <p className="text-xs text-gray-400 arabic">{a.ad_arapca}</p>}
                      </div>
                      {a.ekol_adi && (
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${EKOL_RENK[a.ekol_adi] || 'bg-gray-100 text-gray-600'}`}>
                          {a.ekol_adi}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.vefat_hicri && `ö. ${a.vefat_hicri}/${a.vefat_miladi}`}
                      {a.vefat_yeri && ` · ${a.vefat_yeri}`}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Eserler */}
          {sonuclar.eserler?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Eserler ({sonuclar.eserler.length})
              </p>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {sonuclar.eserler.map(e => (
                  <a key={e.id} href={`/alim/${e.alim_id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.ad}</p>
                      {e.ad_arapca && <p className="text-xs text-gray-400 arabic">{e.ad_arapca}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{e.alim_adi} · {e.tur}</p>
                    </div>
                    {e.dosya_yolu && (
                      <span className="text-xs text-blue-600 flex-shrink-0">PDF ↗</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Görüşler */}
          {sonuclar.gorusler?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Görüşler ({sonuclar.gorusler.length})
              </p>
              <div className="space-y-2">
                {sonuclar.gorusler.map(g => (
                  <a key={g.id} href={`/alim/${g.alim_id}`}
                    className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">{g.konu_basligi}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        {g.ekol_adi && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${EKOL_RENK[g.ekol_adi] || 'bg-gray-100 text-gray-600'}`}>
                            {g.ekol_adi}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {g.icerik_ozet}{g.icerik_ozet?.length >= 200 && '...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">— {g.alim_adi}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {toplamSonuc === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">"{q}" için sonuç bulunamadı.</p>
              <p className="text-xs text-gray-400 mt-1">Farklı bir terim veya Arapça karşılığını deneyin.</p>
            </div>
          )}
        </div>
      )}

      {q.length < 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">En az 2 karakter girin.</p>
          <p className="text-xs text-gray-300 mt-1">Türkçe, Arapça veya Osmanlıca arama yapabilirsiniz.</p>
        </div>
      )}
    </div>
  )
}

export default function AramaSayfa() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400 py-8 text-center">Yükleniyor...</div>}>
      <AramaSayfaIc />
    </Suspense>
  )
}
