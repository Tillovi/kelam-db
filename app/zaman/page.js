'use client'
import { useState, useEffect } from 'react'

const EKOL_RENKLER = {
  'Maturidiyye': '#7C3AED',
  "Es'ariyye":   '#059669',
  "Mu'tezile":   '#D97706',
  'Zeydiyye':    '#DC2626',
  'Imamiyye':    '#2563EB',
  'Selefiyye':   '#6B7280',
}

// Hicri → Miladi yaklaşık dönüşüm
function hicridenMiladi(h) {
  return Math.round(h - h / 33 + 622)
}
function miladiddenHicri(m) {
  return Math.round((m - 622) * 33 / 32)
}

const DONEMLER = [
  { ad: 'Erken Dönem',   bas: 100,  son: 300  },
  { ad: 'Klasik Dönem',  bas: 300,  son: 600  },
  { ad: 'Orta Dönem',    bas: 600,  son: 900  },
  { ad: 'Geç Dönem',     bas: 900,  son: 1100 },
  { ad: 'Osmanlı',       bas: 800,  son: 1300 },
]

export default function ZamanSayfa() {
  const [alimler, setAlimler]     = useState([])
  const [seciliYil, setSeciliYil] = useState(800) // Miladi
  const [pencere, setPencere]     = useState(100)  // ±yıl
  const [mod, setMod]             = useState('miladi') // miladi | hicri
  const [secilenEkol, setSecilenEkol] = useState('')

  useEffect(() => {
    fetch('/api/alim').then(r => r.json()).then(data => {
      setAlimler(data.filter(a => a.vefat_miladi))
    })
  }, [])

  const bas  = seciliYil - pencere
  const son  = seciliYil + pencere
  const hBas = miladiddenHicri(bas)
  const hSon = miladiddenHicri(son)

  const aktifAlimler = alimler.filter(a => {
    const yil = a.vefat_miladi
    const ekolUygun = !secilenEkol || a.ekol_adi === secilenEkol
    return yil >= bas && yil <= son && ekolUygun
  }).sort((a, b) => a.vefat_miladi - b.vefat_miladi)

  // Tüm yıllar için ölçek hesabı
  const minYil = 600
  const maxYil = 1900
  const pozisyon = (yil) => ((yil - minYil) / (maxYil - minYil)) * 100

  const tumEkoller = [...new Set(alimler.map(a => a.ekol_adi).filter(Boolean))]

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Zaman tüneli</h1>
        <p className="text-sm text-gray-500">Dönem kaydırıcısıyla alim dağılımını keşfedin</p>
      </div>

      {/* Kontroller */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Merkez yıl */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-400">Merkez yıl</label>
              <div className="flex gap-1">
                <button onClick={() => setMod('miladi')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${mod==='miladi' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  Miladi
                </button>
                <button onClick={() => setMod('hicri')}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${mod==='hicri' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  Hicri
                </button>
              </div>
            </div>
            <input type="range" min={600} max={1900} step={10} value={seciliYil}
              onChange={e => setSeciliYil(+e.target.value)} className="w-full" />
            <div className="flex justify-between mt-1 text-xs font-medium text-gray-700">
              {mod === 'miladi'
                ? <span>M. {seciliYil}</span>
                : <span>H. {miladiddenHicri(seciliYil)}</span>
              }
            </div>
          </div>

          {/* Pencere */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Aralık: ±{pencere} yıl ({mod==='miladi' ? `${bas}–${son}` : `H.${hBas}–${hSon}`})
            </label>
            <input type="range" min={25} max={300} step={25} value={pencere}
              onChange={e => setPencere(+e.target.value)} className="w-full" />
          </div>

          {/* Ekol filtresi */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Ekol filtresi</label>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setSecilenEkol('')}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${!secilenEkol ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}>
                Tümü
              </button>
              {tumEkoller.map(e => (
                <button key={e} onClick={() => setSecilenEkol(e === secilenEkol ? '' : e)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${secilenEkol===e ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hızlı dönem butonları */}
        <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400 self-center">Hızlı seçim:</span>
          {DONEMLER.map(d => (
            <button key={d.ad}
              onClick={() => { setSeciliYil(Math.round((d.bas + d.son) / 2)); setPencere(Math.round((d.son - d.bas) / 2)) }}
              className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-600 hover:border-gray-500 transition-colors">
              {d.ad}
            </button>
          ))}
        </div>
      </div>

      {/* Görsel zaman çizgisi */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <p className="text-xs text-gray-400 mb-4">Miladi {minYil}–{maxYil}</p>
        <div className="relative h-12 mb-2">
          {/* Arka plan çizgisi */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100" />

          {/* Seçili pencere */}
          <div className="absolute top-3 h-4 bg-gray-100 rounded"
            style={{ left: `${pozisyon(bas)}%`, width: `${pozisyon(son) - pozisyon(bas)}%` }} />

          {/* Alim noktaları */}
          {alimler.filter(a => a.vefat_miladi).map(a => {
            const renk = EKOL_RENKLER[a.ekol_adi] || '#9ca3af'
            const aktif = a.vefat_miladi >= bas && a.vefat_miladi <= son
            return (
              <a key={a.id} href={`/alim/${a.id}`}
                title={`${a.ad} (ö. ${a.vefat_miladi})`}
                style={{
                  position: 'absolute',
                  left: `${pozisyon(a.vefat_miladi)}%`,
                  top: aktif ? '10px' : '14px',
                  width: aktif ? '10px' : '6px',
                  height: aktif ? '10px' : '6px',
                  borderRadius: '50%',
                  background: renk,
                  opacity: aktif ? 1 : 0.3,
                  transform: 'translateX(-50%)',
                  transition: 'all .2s',
                  cursor: 'pointer',
                  zIndex: aktif ? 2 : 1,
                }}
              />
            )
          })}

          {/* Yüzyıl etiketleri */}
          {[700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800].map(y => (
            <span key={y} style={{ position:'absolute', left:`${pozisyon(y)}%`, top:'28px', transform:'translateX(-50%)' }}
              className="text-xs text-gray-300">{y}</span>
          ))}
        </div>
      </div>

      {/* Alim listesi */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">
            {mod==='miladi' ? `M. ${bas}–${son}` : `H. ${hBas}–${hSon}`} arası
          </p>
          <p className="text-xs text-gray-400">{aktifAlimler.length} alim</p>
        </div>
        {aktifAlimler.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Bu dönemde kayıtlı alim yok.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {aktifAlimler.map(a => {
              const renk = EKOL_RENKLER[a.ekol_adi] || '#9ca3af'
              return (
                <a key={a.id} href={`/alim/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: renk }} />
                  <span className="text-sm font-medium text-gray-900 flex-1">{a.ad}</span>
                  {a.ad_arapca && <span className="text-xs text-gray-400 arabic">{a.ad_arapca}</span>}
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ö. {a.vefat_hicri || '?'}/{a.vefat_miladi}
                  </span>
                  {a.ekol_adi && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: renk + '22', color: renk }}>
                      {a.ekol_adi}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
