'use client'
import { useState, useEffect } from 'react'

const EKOL_STILLER = {
  'Mâturîdiyye': { bg: 'bg-purple-50', border: 'border-purple-200', baslik: 'text-purple-900', icerik: 'text-purple-800', alt: 'text-purple-500' },
  "Eş'ariyye":  { bg: 'bg-emerald-50', border: 'border-emerald-200', baslik: 'text-emerald-900', icerik: 'text-emerald-800', alt: 'text-emerald-500' },
  "Mu'tezile":  { bg: 'bg-amber-50',   border: 'border-amber-200',   baslik: 'text-amber-900',   icerik: 'text-amber-800',   alt: 'text-amber-500' },
  'Zeydiyye':   { bg: 'bg-red-50',     border: 'border-red-200',     baslik: 'text-red-900',     icerik: 'text-red-800',     alt: 'text-red-400' },
  'İmâmiyye':   { bg: 'bg-blue-50',    border: 'border-blue-200',    baslik: 'text-blue-900',    icerik: 'text-blue-800',    alt: 'text-blue-400' },
}

const KATEGORILER = [
  { ad: 'İlahiyât', altlar: ['Zât ve Sıfatlar', 'İlâhî Fiiller', 'Teklif-i mâ lâ yûtâk', 'Kader ve İrade'] },
  { ad: 'Nübüvvet', altlar: ['İsmet', 'Mûcize'] },
  { ad: "Sem'iyyât", altlar: [] },
  { ad: 'İmâmet', altlar: [] },
]

export default function SistematikSayfa() {
  const [seciliKonu, setSeciliKonu] = useState('Teklif-i mâ lâ yûtâk')
  const [seciliKategori, setSeciliKategori] = useState('İlahiyât')
  const [gorusler, setGorusler] = useState([])
  const [seciliEkoller, setSeciliEkoller] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => {
    setYukleniyor(true)
    fetch(`/api/sistematik?konu=${encodeURIComponent(seciliKonu)}`)
      .then(r => r.json())
      .then(data => { setGorusler(data); setYukleniyor(false) })
  }, [seciliKonu])

  const tumEkoller = [...new Set(gorusler.map(g => g.ekol_adi).filter(Boolean))]
  const filtrelenmis = seciliEkoller.length > 0
    ? gorusler.filter(g => seciliEkoller.includes(g.ekol_adi))
    : gorusler

  function toggleEkol(ekol) {
    setSeciliEkoller(prev =>
      prev.includes(ekol) ? prev.filter(e => e !== ekol) : [...prev, ekol]
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Sistematik konular</h1>
        <p className="text-sm text-gray-500">Kelam meselelerini ekol karşılaştırmalı inceleyin</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sol: Konu ağacı */}
        <div className="col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {KATEGORILER.map(kat => (
              <div key={kat.ad}>
                <button
                  onClick={() => setSeciliKategori(kat.ad)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-100 transition-colors ${
                    seciliKategori === kat.ad ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {kat.ad}
                </button>
                {seciliKategori === kat.ad && kat.altlar.map(alt => (
                  <button
                    key={alt}
                    onClick={() => setSeciliKonu(alt)}
                    className={`w-full text-left pl-7 pr-4 py-2 text-xs border-b border-gray-100 transition-colors ${
                      seciliKonu === alt
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: Görüşler */}
        <div className="col-span-9">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{seciliKonu}</h2>
              <p className="text-xs text-gray-400">{seciliKategori} · {filtrelenmis.length} kayıt</p>
            </div>
            {/* Ekol filtre */}
            <div className="flex gap-2 items-center flex-wrap">
              {tumEkoller.map(ekol => {
                const stil = EKOL_STILLER[ekol] || {}
                const aktif = seciliEkoller.includes(ekol)
                return (
                  <button
                    key={ekol}
                    onClick={() => toggleEkol(ekol)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      aktif
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 text-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {ekol}
                  </button>
                )
              })}
            </div>
          </div>

          {yukleniyor ? (
            <div className="text-sm text-gray-400 py-12 text-center">Yükleniyor...</div>
          ) : filtrelenmis.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-2">Bu konuda henüz görüş eklenmemiş.</p>
              <p className="text-xs text-gray-300">Admin panelinden kaynak yükleyip AI ile görüş oluşturabilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtrelenmis.map(gorus => {
                const stil = EKOL_STILLER[gorus.ekol_adi] || {
                  bg: 'bg-gray-50', border: 'border-gray-200',
                  baslik: 'text-gray-900', icerik: 'text-gray-700', alt: 'text-gray-400'
                }
                return (
                  <div
                    key={gorus.id}
                    className={`rounded-xl border p-4 ${stil.bg} ${stil.border}`}
                  >
                    <p className={`text-xs font-medium mb-1 ${stil.baslik}`}>{gorus.ekol_adi}</p>
                    <p className={`text-sm leading-relaxed mb-3 ${stil.icerik}`}>{gorus.icerik}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <a
                        href={`/alim/${gorus.alim_id}`}
                        className={`text-xs underline underline-offset-2 ${stil.alt}`}
                      >
                        {gorus.alim_adi}
                      </a>
                      {gorus.isnad_notu && (
                        <span className="text-xs bg-white/60 border border-white/80 rounded px-2 py-0.5 text-gray-500">
                          {gorus.isnad_notu}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
