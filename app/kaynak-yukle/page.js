'use client'
import { useState, useEffect } from 'react'

const ASAMALAR = ['Dosya yükle', 'Claude analizi', 'Önizleme', 'Tamamlandı']

export default function KaynakYukleSayfa() {
  const [asama, setAsama] = useState(0)
  const [dosya, setDosya] = useState(null)
  const [kaynakForm, setKaynakForm] = useState({ baslik:'', yazar:'', yayin_yili:'', yayin_yeri:'' })
  const [analiz, setAnaliz] = useState(null)
  const [secilen, setSecilen] = useState({})
  const [kaynak_id, setKaynak_id] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState(null)
  const [ilerleme, setIlerleme] = useState('')

  async function dosyaYukleVeAnalizEt() {
    if (!dosya) { setHata('Lütfen dosya seçin'); return }
    if (!kaynakForm.baslik) { setHata('Kaynak başlığı zorunlu'); return }

    setYukleniyor(true)
    setHata('')
    setAsama(1)
    setIlerleme('Dosya okunuyor...')

    try {
      // 1. Önce kaynağı veritabanına kaydet
      const kayRes = await fetch('/api/kaynak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kaynakForm, tur: 'birincil', dil: 'ar' })
      })
      const kayVeri = await kayRes.json()
      if (kayVeri.basarili) setKaynak_id(kayVeri.id)

      // 2. Dosyadan metin çıkar
      setIlerleme('Dosya metni çıkarılıyor...')
      const formData = new FormData()
      formData.append('dosya', dosya)
      const metinRes = await fetch('/api/metin-cikart', { method: 'POST', body: formData })
      const metinVeri = await metinRes.json()

      if (!metinVeri.basarili) {
        setHata(metinVeri.hata || 'Metin çıkarılamadı')
        setYukleniyor(false)
        setAsama(0)
        return
      }

      if (metinVeri.kirpildi) {
        setIlerleme('Dosya çok uzun, ilk 80.000 karakter analiz ediliyor...')
      }

      // 3. Claude ile analiz et
      setIlerleme('Claude dosyayı analiz ediyor... (30-90 saniye)')
      const analizRes = await fetch('/api/kaynak-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metin: metinVeri.metin,
          base64: metinVeri.base64,
          dosyaAdi: dosya.name,
          kaynak_bilgisi: kaynakForm,
        })
      })
      const analizVeri = await analizRes.json()

      if (!analizVeri.basarili) {
        setHata(analizVeri.hata || 'Analiz başarısız')
        if (analizVeri.hamMetin) {
          setAnaliz({ hamMetin: analizVeri.hamMetin, alimler: [] })
        }
        setYukleniyor(false)
        setAsama(0)
        return
      }

      setAnaliz(analizVeri.veri)
      // Tüm alimleri varsayılan olarak seç
      const yeniSecilen = {}
      analizVeri.veri.alimler?.forEach((_, i) => { yeniSecilen[i] = true })
      setSecilen(yeniSecilen)
      setAsama(2)

    } catch(e) {
      setHata('Hata: ' + e.message)
      setAsama(0)
    }
    setYukleniyor(false)
    setIlerleme('')
  }

  async function kaydet() {
    setYukleniyor(true)
    setHata('')

    try {
      const res = await fetch('/api/kaynak-kaydet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alimler: analiz.alimler, kaynak_id, secilen })
      })
      const veri = await res.json()

      if (veri.basarili) {
        setSonuc(veri.sonuclar)
        setAsama(3)
      } else {
        setHata(veri.hata || 'Kaydetme hatası')
      }
    } catch(e) {
      setHata('Hata: ' + e.message)
    }
    setYukleniyor(false)
  }

  const secilenSayisi = Object.values(secilen).filter(Boolean).length

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Kaynak yükle ve analiz et</h1>
        <p className="text-sm text-gray-500">PDF, Word veya metin dosyası → Claude analiz eder → veritabanını günceller</p>
      </div>

      {/* İlerleme çubuğu */}
      <div className="flex items-center gap-0 mb-8">
        {ASAMALAR.map((ad, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                i < asama ? 'bg-green-600 text-white' :
                i === asama ? 'bg-gray-900 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < asama ? '✓' : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${i === asama ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{ad}</span>
            </div>
            {i < ASAMALAR.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < asama ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {hata && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex justify-between">
          <span>{hata}</span>
          <button onClick={() => setHata('')}>✕</button>
        </div>
      )}

      {/* Aşama 0: Dosya yükle */}
      {asama === 0 && (
        <div className="space-y-4">
          {/* Kaynak bilgisi */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-medium text-gray-900 mb-4">Kaynak bilgisi</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-600 text-right">Eser adı <span className="text-red-400">*</span></label>
                <input className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  value={kaynakForm.baslik} onChange={e => setKaynakForm(f => ({...f, baslik: e.target.value}))}
                  placeholder="örn. Şerhu'l-Akaid" required />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-600 text-right">Yazar</label>
                <input className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  value={kaynakForm.yazar} onChange={e => setKaynakForm(f => ({...f, yazar: e.target.value}))}
                  placeholder="örn. Teftazani, Sa'duddin" />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-600 text-right">Yayın yılı</label>
                <input className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  type="number" value={kaynakForm.yayin_yili} onChange={e => setKaynakForm(f => ({...f, yayin_yili: e.target.value}))}
                  placeholder="1407" />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm text-gray-600 text-right">Yayın yeri</label>
                <input className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                  value={kaynakForm.yayin_yeri} onChange={e => setKaynakForm(f => ({...f, yayin_yeri: e.target.value}))}
                  placeholder="Kahire" />
              </div>
            </div>
          </div>

          {/* Dosya seç */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-medium text-gray-900 mb-2">Dosya seç</h2>
            <p className="text-xs text-gray-400 mb-4">PDF, DOCX veya TXT · Maksimum 10MB</p>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dosya ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="file" accept=".pdf,.docx,.txt,.md" id="dosya-input"
                onChange={e => setDosya(e.target.files[0])} className="hidden" />
              {dosya ? (
                <div>
                  <p className="text-sm font-medium text-green-700">{dosya.name}</p>
                  <p className="text-xs text-green-600 mt-1">{(dosya.size / 1024).toFixed(0)} KB</p>
                  <button onClick={() => setDosya(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Değiştir</button>
                </div>
              ) : (
                <label htmlFor="dosya-input" className="cursor-pointer">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2v12m0-12L6 6m4-4l4 4M2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Dosya seçmek için tıklayın</p>
                  <p className="text-xs text-gray-400 mt-1">PDF · DOCX · TXT</p>
                </label>
              )}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              Claude dosyayı okuyup içinde geçen alimlerin biyografi, görüş ve eser bilgilerini otomatik çıkaracak. ISNAD 2 atıf bilgileri eklenecek. Sonuçları onayladıktan sonra veritabanına kaydedeceksiniz.
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={dosyaYukleVeAnalizEt} disabled={!dosya || !kaynakForm.baslik || yukleniyor}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Claude ile analiz et →
            </button>
          </div>
        </div>
      )}

      {/* Aşama 1: Yükleniyor */}
      {asama === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">{ilerleme || 'İşleniyor...'}</p>
          <p className="text-xs text-gray-400 mt-2">Dosya boyutuna göre 30-90 saniye sürebilir</p>
        </div>
      )}

      {/* Aşama 2: Önizleme */}
      {asama === 2 && analiz && (
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-medium text-gray-900">Analiz sonuçları</h2>
              <span className="text-xs text-gray-400">{analiz.alimler?.length || 0} alim tespit edildi</span>
            </div>
            {analiz.ozet && <p className="text-sm text-gray-500">{analiz.ozet}</p>}
          </div>

          {/* Alim kartları */}
          <div className="space-y-4 mb-6">
            {(analiz.alimler || []).map((alim, i) => (
              <div key={i} className={`bg-white border rounded-xl overflow-hidden transition-colors ${secilen[i] ? 'border-gray-300' : 'border-gray-100 opacity-60'}`}>
                {/* Başlık satırı */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                  <input type="checkbox" checked={!!secilen[i]}
                    onChange={e => setSecilen(s => ({...s, [i]: e.target.checked}))}
                    className="w-4 h-4 rounded" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{alim.ad}</p>
                      {alim.ad_arapca && <span className="text-sm text-gray-400 arabic">{alim.ad_arapca}</span>}
                      {alim.veritabani_id ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Mevcut alim · güncelleme</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Yeni alim</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {alim.vefat_hicri && `ö. ${alim.vefat_hicri}`}
                      {alim.vefat_miladi && `/${alim.vefat_miladi}`}
                      {alim.vefat_yeri && ` · ${alim.vefat_yeri}`}
                      {alim.ekol_adi && ` · ${alim.ekol_adi}`}
                    </p>
                  </div>
                </div>

                {/* İçerik */}
                <div className="px-5 py-4 space-y-4">
                  {/* Biyografi */}
                  {alim.biyografi && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Biyografi</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{alim.biyografi}</p>
                      {alim.biyografi_sayfa && <p className="text-xs text-gray-400 mt-1 italic">{alim.biyografi_sayfa}</p>}
                    </div>
                  )}

                  {/* Görüşler */}
                  {alim.gorusler?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Görüşler ({alim.gorusler.length})
                      </p>
                      <div className="space-y-2">
                        {alim.gorusler.map((g, j) => (
                          <div key={j} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">{g.konu_basligi}
                              {g.konu_kategorisi && <span className="ml-2 text-gray-400 font-normal">— {g.konu_kategorisi}</span>}
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed">{g.icerik}</p>
                            {g.isnad_notu && (
                              <p className="text-xs text-gray-400 mt-1.5 italic border-t border-gray-200 pt-1.5">{g.isnad_notu}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eserler */}
                  {alim.eserler?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Eserler ({alim.eserler.length})
                      </p>
                      <div className="space-y-1">
                        {alim.eserler.map((e, j) => (
                          <div key={j} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">{e.ad}</span>
                            {e.ad_arapca && <span className="text-gray-400 arabic text-xs">{e.ad_arapca}</span>}
                            {e.tur && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{e.tur}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Kaydet butonu */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {secilenSayisi} / {analiz.alimler?.length || 0} alim seçili
            </p>
            <div className="flex gap-3">
              <button onClick={() => setAsama(0)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                ← Geri
              </button>
              <button onClick={kaydet} disabled={secilenSayisi === 0 || yukleniyor}
                className="px-6 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {yukleniyor ? 'Kaydediliyor...' : `${secilenSayisi} alimi kaydet`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aşama 3: Tamamlandı */}
      {asama === 3 && sonuc && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Kaydedildi!</h2>
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-sm mx-auto">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-medium text-gray-900">{sonuc.eklenenAlimler}</p>
              <p className="text-xs text-gray-500 mt-0.5">Yeni alim</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-medium text-gray-900">{sonuc.eklenenGorusler}</p>
              <p className="text-xs text-gray-500 mt-0.5">Yeni görüş</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-medium text-gray-900">{sonuc.eklenenEserler}</p>
              <p className="text-xs text-gray-500 mt-0.5">Yeni eser</p>
            </div>
          </div>
          {sonuc.guncellenenAlimler > 0 && (
            <p className="text-sm text-gray-500 mb-4">{sonuc.guncellenenAlimler} mevcut alim güncellendi</p>
          )}
          {sonuc.atlanalar?.length > 0 && (
            <div className="text-left bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-xs text-amber-700">
              <p className="font-medium mb-1">Zaten mevcut (atlandı):</p>
              {sonuc.atlanalar.map((a, i) => <p key={i}>· {a}</p>)}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <a href="/" className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Alimlere git
            </a>
            <button onClick={() => { setAsama(0); setDosya(null); setAnaliz(null); setSonuc(null); setKaynak_id(null) }}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
              Yeni kaynak yükle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
