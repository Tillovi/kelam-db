'use client'
import { useEffect, useRef, useState } from 'react'

const EKOL_RENKLER = {
  'Maturidiyye': '#7C3AED',
  "Es'ariyye":   '#059669',
  "Mu'tezile":   '#D97706',
  'Zeydiyye':    '#DC2626',
  'Imamiyye':    '#2563EB',
  'Selefiyye':   '#6B7280',
}

const ILISKI_RENK = {
  hoca:      '#6366f1',
  ogrenci:   '#6366f1',
  muasir:    '#94a3b8',
  rakip:     '#ef4444',
  etkileyen: '#f59e0b',
}

export default function AgSayfa() {
  const svgRef        = useRef(null)
  const [alimler, setAlimler]       = useState([])
  const [iliskiler, setIliskiler]   = useState([])
  const [secili, setSecili]         = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre]         = useState('tumu')

  useEffect(() => {
    Promise.all([
      fetch('/api/alim').then(r => r.json()),
      fetch('/api/ag').then(r => r.json()),
    ]).then(([a, il]) => {
      setAlimler(a)
      setIliskiler(il)
      setYukleniyor(false)
    })
  }, [])

  useEffect(() => {
    if (!alimler.length || !svgRef.current) return
    if (typeof window === 'undefined') return

    const filtreliIliskiler = filtre === 'tumu'
      ? iliskiler
      : iliskiler.filter(i => i.iliski_turu === filtre)

    // Sadece bağlı düğümleri göster
    const baglıIds = new Set()
    filtreliIliskiler.forEach(i => { baglıIds.add(i.alim1_id); baglıIds.add(i.alim2_id) })
    const dugumler = alimler
      .filter(a => baglıIds.has(a.id) || baglıIds.has(String(a.id)))
      .map(a => ({ ...a, id: String(a.id) }))

    const baglar = filtreliIliskiler.map(i => ({
      ...i,
      source: String(i.alim1_id),
      target: String(i.alim2_id),
    }))

    // D3 yükle
    const loadD3 = () => {
      if (window.d3) {
        cizGraf(window.d3, dugumler, baglar)
      } else {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
        s.onload = () => cizGraf(window.d3, dugumler, baglar)
        document.head.appendChild(s)
      }
    }
    loadD3()
  }, [alimler, iliskiler, filtre])

  function cizGraf(d3, dugumler, baglar) {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const w = svgRef.current.clientWidth || 700
    const h = 480

    svg.attr('viewBox', `0 0 ${w} ${h}`)

    const g = svg.append('g')

    // Zoom
    svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform)))

    // Simülasyon
    const sim = d3.forceSimulation(dugumler)
      .force('link', d3.forceLink(baglar).id(d => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide(22))

    // Oklar
    svg.append('defs').selectAll('marker')
      .data(['hoca','muasir','rakip','etkileyen'])
      .join('marker')
      .attr('id', d => `ok-${d}`)
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 20).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', d => ILISKI_RENK[d] || '#94a3b8')

    // Bağlar
    const link = g.append('g').selectAll('line')
      .data(baglar).join('line')
      .attr('stroke', d => ILISKI_RENK[d.iliski_turu] || '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#ok-${d.iliski_turu})`)

    // Düğüm grupları
    const dugum = g.append('g').selectAll('g')
      .data(dugumler).join('g')
      .attr('cursor', 'pointer')
      .on('click', (e, d) => setSecili(d))
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
        .on('drag', (e, d) => { d.fx=e.x; d.fy=e.y })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null })
      )

    dugum.append('circle')
      .attr('r', 14)
      .attr('fill', d => EKOL_RENKLER[d.ekol_adi] || '#9ca3af')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)

    dugum.append('text')
      .text(d => d.ad ? d.ad.split(' ')[0] : '?')
      .attr('text-anchor', 'middle')
      .attr('dy', 26)
      .attr('font-size', 10)
      .attr('fill', '#374151')
      .attr('font-family', 'sans-serif')

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      dugum.attr('transform', d => `translate(${d.x},${d.y})`)
    })
  }

  const tumIliskiTurleri = [...new Set(iliskiler.map(i => i.iliski_turu))]

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Alim ilişki ağı</h1>
        <p className="text-sm text-gray-500">Hoca–öğrenci zincirleri ve alimler arası ilişkiler</p>
      </div>

      {/* Filtreler ve lejant */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs text-gray-400">İlişki türü:</span>
          <button onClick={() => setFiltre('tumu')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filtre==='tumu' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}>
            Tümü
          </button>
          {tumIliskiTurleri.map(t => (
            <button key={t} onClick={() => setFiltre(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filtre===t ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'}`}
              style={filtre===t ? {} : { borderColor: ILISKI_RENK[t] + '88', color: ILISKI_RENK[t] }}>
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-3 items-center flex-wrap">
          {Object.entries(EKOL_RENKLER).map(([ad, renk]) => (
            <span key={ad} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: renk }} />
              {ad}
            </span>
          ))}
        </div>
      </div>

      {/* Graf */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {yukleniyor ? (
          <div className="h-96 flex items-center justify-center text-sm text-gray-400">Yükleniyor...</div>
        ) : alimler.length === 0 || iliskiler.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-sm text-gray-400">
            <p className="mb-2">Gösterilecek ilişki kaydı yok.</p>
            <p className="text-xs text-gray-300">Admin paneli → "İlişki ekle" ile hoca–öğrenci bağlarını girin.</p>
          </div>
        ) : (
          <svg ref={svgRef} width="100%" height="480" style={{ display: 'block' }} />
        )}
      </div>

      {/* Seçili alim bilgisi */}
      {secili && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{secili.ad}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {secili.ekol_adi || '—'} · ö. {secili.vefat_hicri || '?'}/{secili.vefat_miladi || '?'}
            </p>
          </div>
          <a href={`/alim/${secili.id}`}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700">
            Profile git →
          </a>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Düğümleri sürükleyebilir, tekerlek ile yakınlaştırabilirsiniz.
      </p>
    </div>
  )
}
