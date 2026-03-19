'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const EKOL_RENKLERI = {
  'Mâturîdiyye': 'bg-purple-100 text-purple-800',
  "Eş'ariyye": 'bg-emerald-100 text-emerald-800',
  "Mu'tezile": 'bg-amber-100 text-amber-800',
  'Zeydiyye': 'bg-red-100 text-red-800',
  'İmâmiyye': 'bg-blue-100 text-blue-800',
  'Selefiyye': 'bg-gray-100 text-gray-700',
}

export default function AlimProfil() {
  const { id } = useParams()
  const [alim, setAlim] = useState(null)
  const [aktifSekme, setAktifSekme] = useState('biyografi')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aiUretiyor, setAiUretiyor] = useState(false)

  useEffect(() => {
    fetch(`/api/alim/${id}`)
      .then(r => r.json())
      .then(data => {
        setAlim(data)
        setYukleniyor(false)
      })
  }, [id])

  if (yukleniyor) return (
    <div className="text-sm text-gray-400 py-16 text-center">Yükleniyor...</div>
  )
  if (!alim) return (
    <div className="text-sm text-gray-500 py-16 text-center">Alim bulunamadı.</div>
  )

  const ekolRenk = EKOL_RENKLERI[alim.ekol_adi] || 'bg-gray-100 text-gray-700'
  const basTaharf = alim.ad_arapca ? alim.ad_arapca[0] : alim.ad[0]

  return (
    <div>
      {/* Geri */}
      <a href="/" className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 mb-6 gap-1">
        ← Aramaya dön
      </a>

      {/* Başlık kartı */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-xl text-purple-600 arabic flex-shrink-0">
            {basTaharf}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <h1 className="text-xl font-medium text-gray-900">{alim.ad}</h1>
              {alim.ekol_adi && (
                <span className={`badge-ekol ${ekolRenk}`}>{alim.ekol_adi}</span>
              )}
            </div>
            {alim.ad_latinize && (
              <p className="text-sm text-gray-500 mb-1">{alim.ad_latinize}</p>
            )}
            {alim.ad_arapca && (
              <p className="text-sm text-gray-400 arabic mb-2">{alim.ad_arapca}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              {alim.vefat_hicri && <span>ö. {alim.vefat_hicri}/{alim.vefat_miladi}</span>}
              {alim.dogum_yeri && <span>· Doğum: {alim.dogum_yeri}</span>}
              {alim.vefat_yeri && <span>· Vefat: {alim.vefat_yeri}</span>}
              {alim.mezhep && (
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                  {alim.mezhep}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="border-b border-gray-200 mb-6 flex gap-1">
        {[
          { key: 'biyografi', label: 'Biyografi' },
          { key: 'gorusler', label: 'Görüşleri' },
          { key: 'eserler', label: 'Eserleri' },
          { key: 'iliskiler', label: 'Hoca / Öğrenci' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setAktifSekme(s.key)}
            className={`px-4 py-2.5 text-sm transition-colors ${
              aktifSekme === s.key ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Sekme içerikleri */}
      {aktifSekme === 'biyografi' && (
        <BiyografiSekme alim={alim} aiUretiyor={aiUretiyor} setAiUretiyor={setAiUretiyor} />
      )}
      {aktifSekme === 'gorusler' && <GoruslerSekme alim={alim} />}
      {aktifSekme === 'eserler' && <EserlerSekme alim={alim} />}
      {aktifSekme === 'iliskiler' && <IliskilerSekme alim={alim} />}
    </div>
  )
}

function BiyografiSekme({ alim }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {alim.biyografi ? (
        <>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">{alim.biyografi}</p>
          {alim.biyografi_kaynaklar?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2">Kaynaklar:</p>
              <div className="flex flex-wrap gap-2">
                {alim.biyografi_kaynaklar.map((k, i) => (
                  <span key={i} className="isnad-tag">
                    {i + 1} {k.isnad2_metni || k.baslik}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-4">Biyografi henüz eklenmemiş.</p>
          <p className="text-xs text-gray-300">Admin panelinden kaynak yükleyerek AI destekli biyografi oluşturabilirsiniz.</p>
        </div>
      )}
    </div>
  )
}

function GoruslerSekme({ alim }) {
  const [gorusler, setGorusler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    fetch(`/api/alim/${alim.id}/gorusler`)
      .then(r => r.json())
      .then(data => { setGorusler(data); setYukleniyor(false) })
  }, [alim.id])

  if (yukleniyor) return <div className="text-xs text-gray-400 py-8 text-center">Yükleniyor...</div>

  // Kategorilere göre grupla
  const kategoriler = {}
  gorusler.forEach(g => {
    const kat = g.konu_kategorisi || 'Diğer'
    if (!kategoriler[kat]) kategoriler[kat] = []
    kategoriler[kat].push(g)
  })

  return (
    <div className="space-y-6">
      {Object.keys(kategoriler).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Henüz görüş eklenmemiş.</p>
          <p className="text-xs text-gray-300">Admin panelinden kaynak yükleyerek AI destekli görüş analizi oluşturabilirsiniz.</p>
        </div>
      )}
      {Object.entries(kategoriler).map(([kategori, gorusListesi]) => (
        <div key={kategori}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{kategori}</p>
          <div className="space-y-3">
            {gorusListesi.map(gorus => (
              <div key={gorus.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-medium text-gray-800 mb-2">{gorus.konu_basligi}</p>
                <div className="pl-3 border-l-2 border-gray-200">
                  <p className="text-sm text-gray-600 leading-relaxed">{gorus.icerik}</p>
                </div>
                {gorus.isnad_notu && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="isnad-tag">{gorus.isnad_notu}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EserlerSekme({ alim }) {
  const [eserler, setEserler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    fetch(`/api/alim/${alim.id}/eserler`)
      .then(r => r.json())
      .then(data => { setEserler(data); setYukleniyor(false) })
  }, [alim.id])

  if (yukleniyor) return <div className="text-xs text-gray-400 py-8 text-center">Yükleniyor...</div>

  const turRenk = {
    telif: 'bg-purple-50 text-purple-700',
    serh: 'bg-blue-50 text-blue-700',
    hasiye: 'bg-emerald-50 text-emerald-700',
    talika: 'bg-amber-50 text-amber-700',
    risale: 'bg-gray-100 text-gray-600',
  }

  // Asıl eserler ve bunların altındaki şerh/haşiyeleri grupla
  const asilEserler = eserler.filter(e => !e.esas_eser_id)
  const bagliEserler = eserler.filter(e => e.esas_eser_id)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {asilEserler.length === 0 && (
        <div className="p-6 text-center text-sm text-gray-400">Eser eklenmemiş.</div>
      )}
      {asilEserler.map((eser, i) => {
        const altEserler = bagliEserler.filter(e => e.esas_eser_id === eser.id)
        return (
          <div key={eser.id}>
            {i > 0 && <div className="border-t border-gray-100" />}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{eser.ad}</span>
                  {eser.ad_arapca && (
                    <span className="text-xs text-gray-400 arabic ml-2">{eser.ad_arapca}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {eser.tur && (
                    <span className={`badge-ekol ${turRenk[eser.tur] || 'bg-gray-100 text-gray-600'}`}>
                      {eser.tur}
                    </span>
                  )}
                  {eser.dosya_yolu && (
                    <a
                      href={eser.dosya_yolu}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      PDF ↗
                    </a>
                  )}
                </div>
              </div>
              {eser.aciklama && (
                <p className="text-xs text-gray-500 mt-1">{eser.aciklama}</p>
              )}
              {eser.isnad_bilgisi && (
                <div className="mt-2">
                  <span className="isnad-tag">{eser.isnad_bilgisi}</span>
                </div>
              )}
              {/* Şerh ve haşiyeler */}
              {altEserler.map(alt => (
                <div key={alt.id} className="mt-2 ml-4 pl-3 border-l-2 border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-500">↳ {alt.alim_adi} — </span>
                      <span className="text-xs font-medium text-gray-700">{alt.ad}</span>
                    </div>
                    <span className={`badge-ekol ${turRenk[alt.tur] || 'bg-gray-100 text-gray-500'} text-xs`}>
                      {alt.tur}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IliskilerSekme({ alim }) {
  const [iliskiler, setIliskiler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    fetch(`/api/alim/${alim.id}/iliskiler`)
      .then(r => r.json())
      .then(data => { setIliskiler(data); setYukleniyor(false) })
  }, [alim.id])

  if (yukleniyor) return <div className="text-xs text-gray-400 py-8 text-center">Yükleniyor...</div>

  const turLabel = {
    hoca: 'Hocaları',
    ogrenci: 'Öğrencileri',
    muasir: 'Muasırları',
    rakip: 'İlmî rakipleri',
    etkileyen: 'Etkilendiği alimler',
  }

  const gruplar = {}
  iliskiler.forEach(il => {
    if (!gruplar[il.iliski_turu]) gruplar[il.iliski_turu] = []
    gruplar[il.iliski_turu].push(il)
  })

  return (
    <div className="space-y-6">
      {Object.keys(gruplar).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          İlişki kaydı eklenmemiş.
        </div>
      )}
      {Object.entries(gruplar).map(([tur, liste]) => (
        <div key={tur}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            {turLabel[tur] || tur}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {liste.map(il => (
              <a
                key={il.id}
                href={`/alim/${il.diger_alim_id}`}
                className="bg-white border border-gray-200 rounded-lg p-3 card-hover"
              >
                <p className="text-sm font-medium text-gray-900">{il.diger_alim_adi}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {il.vefat_hicri && `ö. ${il.vefat_hicri}`}
                </p>
                {il.aciklama && (
                  <p className="text-xs text-gray-500 mt-1">{il.aciklama}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
