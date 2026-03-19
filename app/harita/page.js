'use client'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const EKOL_RENKLER = {
  'Maturidiyye':  { renk: '#7C3AED', bg: 'bg-purple-100 text-purple-800' },
  "Es'ariyye":    { renk: '#059669', bg: 'bg-emerald-100 text-emerald-800' },
  "Mu'tezile":    { renk: '#D97706', bg: 'bg-amber-100 text-amber-800' },
  'Zeydiyye':     { renk: '#DC2626', bg: 'bg-red-100 text-red-800' },
  'Imamiyye':     { renk: '#2563EB', bg: 'bg-blue-100 text-blue-800' },
  'Selefiyye':    { renk: '#6B7280', bg: 'bg-gray-100 text-gray-700' },
}

const LeafletHarita = dynamic(() => import('@/components/LeafletHarita'), { ssr: false, loading: () => (
  <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
    <p className="text-sm text-gray-400">Harita yükleniyor...</p>
  </div>
)})

export default function HaritaSayfa() {
  const [alimler, setAlimler]           = useState([])
  const [filtrelenmis, setFiltrelenmis] = useState([])
  const [secilenEkoller, setSecilenEkoller] = useState([])
  const [donem, setDonem]               = useState([700, 1500])
  const [seciliAlim, setSeciliAlim]     = useState(null)
  const [ekoller, setEkoller]           = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/api/alim').then(r => r.json()),
      fetch('/api/ekol').then(r => r.json()),
    ]).then(([alimData, ekolData]) => {
      const koordinatli = alimData.filter(a => a.enlem && a.boylam)
      setAlimler(koordinatli)
      setFiltrelenmis(koordinatli)
      setEkoller(ekolData)
    })
  }, [])

  useEffect(() => {
    let sonuc = alimler
    if (secilenEkoller.length > 0) {
      sonuc = sonuc.filter(a => secilenEkoller.includes(a.ekol_adi))
    }
    sonuc = sonuc.filter(a => {
      const yil = a.vefat_miladi || 0
      return yil >= donem[0] && yil <= donem[1]
    })
    setFiltrelenmis(sonuc)
  }, [secilenEkoller, donem, alimler])

  function toggleEkol(ad) {
    setSecilenEkoller(prev =>
      prev.includes(ad) ? prev.filter(e => e !== ad) : [...prev, ad]
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Coğrafi harita</h1>
        <p className="text-sm text-gray-500">Alimlerin yaşadığı bölgeler · ekol renk kodlaması</p>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-start">
          {/* Ekol filtreleri */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-2">Ekol</p>
            <div className="flex flex-wrap gap-2">
              {ekoller.map(e => {
                const stil = EKOL_RENKLER[e.ad] || { renk: '#6B7280', bg: 'bg-gray-100 text-gray-700' }
                const aktif = secilenEkoller.includes(e.ad)
                return (
                  <button
                    key={e.id}
                    onClick={() => toggleEkol(e.ad)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
                      aktif ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: aktif ? 'white' : stil.renk }}
                    />
                    {e.ad}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dönem filtresi */}
          <div className="w-64">
            <p className="text-xs text-gray-400 mb-2">
              Dönem (Miladi): <span className="font-medium text-gray-700">{donem[0]} – {donem[1]}</span>
            </p>
            <div className="flex gap-2 items-center">
              <input type="range" min="500" max="1900" step="50" value={donem[0]}
                onChange={e => setDonem([+e.target.value, donem[1]])}
                className="flex-1" />
              <input type="range" min="500" max="1900" step="50" value={donem[1]}
                onChange={e => setDonem([donem[0], +e.target.value])}
                className="flex-1" />
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          {filtrelenmis.length} alim gösteriliyor
          {alimler.length > filtrelenmis.length && ` (toplam ${alimler.length} koordinatlı kayıt)`}
        </p>
      </div>

      {/* Harita */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: '520px' }}>
        <LeafletHarita
          alimler={filtrelenmis}
          ekolRenkler={EKOL_RENKLER}
          onAlimSec={setSeciliAlim}
        />
      </div>

      {/* Seçili alim bilgisi */}
      {seciliAlim && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{seciliAlim.ad}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {seciliAlim.ekol_adi && <span className="mr-2">{seciliAlim.ekol_adi}</span>}
              {seciliAlim.vefat_yeri && <span>· {seciliAlim.vefat_yeri}</span>}
              {seciliAlim.vefat_hicri && <span> · ö. {seciliAlim.vefat_hicri}/{seciliAlim.vefat_miladi}</span>}
            </p>
          </div>
          <a href={`/alim/${seciliAlim.id}`}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors">
            Profile git →
          </a>
        </div>
      )}

      {/* Koordinat ekleme notu */}
      {alimler.length === 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Haritada gösterilecek alim yok. Admin panelinde alimlere enlem/boylam ekleyin.
        </div>
      )}
    </div>
  )
}
