'use client'
import { useEffect, useRef } from 'react'

export default function LeafletHarita({ alimler, ekolRenkler, onAlimSec }) {
  const mapRef      = useRef(null)
  const leafletRef  = useRef(null)
  const markersRef  = useRef([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Leaflet JS
    const initMap = () => {
      if (leafletRef.current || !mapRef.current) return
      const L = window.L

      const map = L.map(mapRef.current).setView([35, 45], 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      leafletRef.current = map
    }

    if (window.L) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, [])

  // Markerları güncelle
  useEffect(() => {
    const map = leafletRef.current
    if (!map || typeof window === 'undefined' || !window.L) return
    const L = window.L

    // Eski markerları temizle
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    alimler.forEach(alim => {
      if (!alim.enlem || !alim.boylam) return

      const stil = ekolRenkler[alim.ekol_adi] || { renk: '#6B7280' }

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:${stil.renk};border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:pointer;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([alim.enlem, alim.boylam], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <p style="font-size:14px;font-weight:500;margin:0 0 4px">${alim.ad}</p>
            ${alim.ad_arapca ? `<p style="font-size:12px;color:#666;margin:0 0 4px;direction:rtl">${alim.ad_arapca}</p>` : ''}
            <p style="font-size:12px;color:#666;margin:0 0 6px">
              ${alim.ekol_adi || ''} ${alim.vefat_hicri ? '· ö. ' + alim.vefat_hicri : ''}
            </p>
            <a href="/alim/${alim.id}" style="font-size:12px;color:#1d4ed8;text-decoration:none">
              Profile git →
            </a>
          </div>
        `, { maxWidth: 220 })

      marker.on('click', () => onAlimSec && onAlimSec(alim))
      markersRef.current.push(marker)
    })

    // Tüm markerları kapsayacak zoom
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.15))
    }
  }, [alimler, ekolRenkler])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
