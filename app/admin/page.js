'use client'
import { useState, useEffect, useRef } from 'react'

export default function AdminSayfa() {
  const [aktifPanel, setAktifPanel] = useState('alim-ekle')
  const [mesaj, setMesaj] = useState('')
  const [hata, setHata] = useState('')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Admin paneli</h1>
          <p className="text-sm text-gray-400 mt-0.5">İçerik yönetimi ve AI destekli veri girişi</p>
        </div>
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600">← Siteye dön</a>
      </div>

      {mesaj && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {mesaj}
        </div>
      )}
      {hata && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {hata}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Sol menü */}
        <div className="col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {[
              { key: 'alim-ekle', label: 'Alim ekle' },
              { key: 'kaynak-ekle', label: 'Kaynak ekle' },
              { key: 'ai-icerik', label: 'AI ile içerik üret' },
              { key: 'gorus-ekle', label: 'Görüş ekle' },
              { key: 'eser-ekle', label: 'Eser ekle' },
              { key: 'iliski-ekle', label: 'İlişki ekle' },
            ].map((panel, i, arr) => (
              <button
                key={panel.key}
                onClick={() => setAktifPanel(panel.key)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  i < arr.length - 1 ? 'border-b border-gray-100' : ''
                } ${
                  aktifPanel === panel.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {panel.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sağ içerik */}
        <div className="col-span-9">
          {aktifPanel === 'alim-ekle' && <AlimEkleFormu setMesaj={setMesaj} setHata={setHata} />}
          {aktifPanel === 'kaynak-ekle' && <KaynakEkleFormu setMesaj={setMesaj} setHata={setHata} />}
          {aktifPanel === 'ai-icerik' && <AiIcerikPaneli setMesaj={setMesaj} setHata={setHata} />}
          {aktifPanel === 'gorus-ekle' && <GorusEkleFormu setMesaj={setMesaj} setHata={setHata} />}
          {aktifPanel === 'eser-ekle' && <EserEkleFormu setMesaj={setMesaj} setHata={setHata} />}
          {aktifPanel === 'iliski-ekle' && <IliskiEkleFormu setMesaj={setMesaj} setHata={setHata} />}
        </div>
      </div>
    </div>
  )
}

// ---------- Yardımcı bileşenler ----------

function FormSatir({ label, required, children }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      <label className="text-sm text-gray-600 pt-2.5 text-right">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
const selectCls = inputCls

// ---------- Alim Ekle ----------
function AlimEkleFormu({ setMesaj, setHata }) {
  const [ekoller, setEkoller] = useState([])
  const [form, setForm] = useState({
    ad: '', ad_arapca: '', ad_latinize: '', lakap: '',
    vefat_hicri: '', vefat_miladi: '', dogum_yeri: '', vefat_yeri: '',
    ekol_id: '', mezhep: '', biyografi: '', enlem: '', boylam: ''
  })

  useEffect(() => {
    fetch('/api/ekol').then(r => r.json()).then(setEkoller)
  }, [])

  async function gonder(e) {
    e.preventDefault()
    setHata('')
    const r = await fetch('/api/alim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (d.basarili) {
      setMesaj(`✓ "${form.ad}" başarıyla eklendi (ID: ${d.id})`)
      setForm({ ad: '', ad_arapca: '', ad_latinize: '', lakap: '', vefat_hicri: '', vefat_miladi: '', dogum_yeri: '', vefat_yeri: '', ekol_id: '', mezhep: '', biyografi: '', enlem: '', boylam: '' })
    } else {
      setHata('Kayıt sırasında hata oluştu.')
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-6">Yeni alim ekle</h2>
      <form onSubmit={gonder} className="space-y-4">
        <FormSatir label="Türkçe ad" required>
          <input className={inputCls} value={form.ad} onChange={e => set('ad', e.target.value)} placeholder="Teftâzânî" required />
        </FormSatir>
        <FormSatir label="Arapça ad">
          <input className={inputCls + ' font-arabic'} dir="rtl" value={form.ad_arapca} onChange={e => set('ad_arapca', e.target.value)} placeholder="التفتازاني" />
        </FormSatir>
        <FormSatir label="Latinize tam ad">
          <input className={inputCls} value={form.ad_latinize} onChange={e => set('ad_latinize', e.target.value)} placeholder="Sa'düddîn Mes'ûd b. Ömer et-Teftâzânî" />
        </FormSatir>
        <FormSatir label="Ekol">
          <select className={selectCls} value={form.ekol_id} onChange={e => set('ekol_id', e.target.value)}>
            <option value="">— Seçin —</option>
            {ekoller.map(e => <option key={e.id} value={e.id}>{e.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Mezhep">
          <select className={selectCls} value={form.mezhep} onChange={e => set('mezhep', e.target.value)}>
            <option value="">— Seçin —</option>
            {['Hanefî', 'Mâlikî', 'Şâfiî', 'Hanbelî', 'Câferî', 'Zeydî'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FormSatir>
        <FormSatir label="Vefat (Hicri)">
          <input className={inputCls} value={form.vefat_hicri} onChange={e => set('vefat_hicri', e.target.value)} placeholder="792" />
        </FormSatir>
        <FormSatir label="Vefat (Miladi)">
          <input className={inputCls} type="number" value={form.vefat_miladi} onChange={e => set('vefat_miladi', e.target.value)} placeholder="1390" />
        </FormSatir>
        <FormSatir label="Doğum yeri">
          <input className={inputCls} value={form.dogum_yeri} onChange={e => set('dogum_yeri', e.target.value)} placeholder="Teftâzân/Horasan" />
        </FormSatir>
        <FormSatir label="Vefat yeri">
          <input className={inputCls} value={form.vefat_yeri} onChange={e => set('vefat_yeri', e.target.value)} placeholder="Semerkand" />
        </FormSatir>
        <FormSatir label="Enlem/Boylam">
          <div className="flex gap-2">
            <input className={inputCls} type="number" step="0.0001" value={form.enlem} onChange={e => set('enlem', e.target.value)} placeholder="39.6542" />
            <input className={inputCls} type="number" step="0.0001" value={form.boylam} onChange={e => set('boylam', e.target.value)} placeholder="66.9597" />
          </div>
        </FormSatir>
        <FormSatir label="Biyografi">
          <textarea className={inputCls} rows={4} value={form.biyografi} onChange={e => set('biyografi', e.target.value)} placeholder="Kısa biyografi..." />
        </FormSatir>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
            Kaydet
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------- Kaynak Ekle ----------
function KaynakEkleFormu({ setMesaj, setHata }) {
  const [form, setForm] = useState({ baslik: '', yazar: '', yayin_yili: '', yayin_yeri: '', tur: 'birincil', dil: 'ar', notlar: '' })

  async function gonder(e) {
    e.preventDefault()
    const r = await fetch('/api/kaynak', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const d = await r.json()
    if (d.basarili) {
      setMesaj(`✓ "${form.baslik}" kaydedildi (ID: ${d.id})`)
      setForm({ baslik: '', yazar: '', yayin_yili: '', yayin_yeri: '', tur: 'birincil', dil: 'ar', notlar: '' })
    } else setHata('Hata oluştu.')
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-6">Kaynak ekle</h2>
      <form onSubmit={gonder} className="space-y-4">
        <FormSatir label="Eser adı" required>
          <input className={inputCls} value={form.baslik} onChange={e => set('baslik', e.target.value)} placeholder="Şerhu'l-Akāid" required />
        </FormSatir>
        <FormSatir label="Yazar">
          <input className={inputCls} value={form.yazar} onChange={e => set('yazar', e.target.value)} placeholder="Teftâzânî, Sa'düddîn" />
        </FormSatir>
        <FormSatir label="Yayın yılı">
          <input className={inputCls} type="number" value={form.yayin_yili} onChange={e => set('yayin_yili', e.target.value)} placeholder="1407" />
        </FormSatir>
        <FormSatir label="Yayın yeri">
          <input className={inputCls} value={form.yayin_yeri} onChange={e => set('yayin_yeri', e.target.value)} placeholder="Kahire" />
        </FormSatir>
        <FormSatir label="Tür">
          <select className={selectCls} value={form.tur} onChange={e => set('tur', e.target.value)}>
            <option value="birincil">Birincil kaynak</option>
            <option value="ikincil">İkincil kaynak</option>
            <option value="ansiklopedi">Ansiklopedi</option>
            <option value="makale">Makale</option>
          </select>
        </FormSatir>
        <FormSatir label="Dil">
          <select className={selectCls} value={form.dil} onChange={e => set('dil', e.target.value)}>
            <option value="ar">Arapça</option>
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
            <option value="ota">Osmanlıca</option>
          </select>
        </FormSatir>
        <FormSatir label="Notlar">
          <textarea className={inputCls} rows={2} value={form.notlar} onChange={e => set('notlar', e.target.value)} placeholder="Ek notlar..." />
        </FormSatir>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">Kaydet</button>
        </div>
      </form>
    </div>
  )
}

// ---------- AI İçerik Üret ----------
function AiIcerikPaneli({ setMesaj, setHata }) {
  const [alimler, setAlimler] = useState([])
  const [kaynaklar, setKaynaklar] = useState([])
  const [form, setForm] = useState({ alim_id: '', kaynak_id: '', tur: 'biyografi', kaynak_metni: '' })
  const [cikti, setCikti] = useState('')
  const [uretiliyor, setUretiliyor] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/alim').then(r => r.json()).then(setAlimler)
    fetch('/api/kaynak').then(r => r.json()).then(setKaynaklar)
  }, [])

  async function uret() {
    if (!form.alim_id) { setHata('Lütfen bir alim seçin.'); return }
    setUretiliyor(true)
    setCikti('')
    setHata('')

    const r = await fetch('/api/ai-uret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let tamMetin = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const parca = decoder.decode(value)
      const satirlar = parca.split('\n')
      for (const satir of satirlar) {
        if (satir.startsWith('data: ')) {
          const veri = satir.slice(6)
          if (veri === '[BITTI]') { setUretiliyor(false); break }
          try {
            const { metin } = JSON.parse(veri)
            tamMetin += metin
            setCikti(tamMetin)
          } catch {}
        }
      }
    }
    setUretiliyor(false)
  }

  async function kaydet() {
    if (!cikti || !form.alim_id) return
    if (form.tur === 'biyografi') {
      await fetch(`/api/alim/${form.alim_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biyografi: cikti }),
      })
      setMesaj('✓ Biyografi kaydedildi.')
    } else if (form.tur === 'gorus') {
      try {
        const gorusler = JSON.parse(cikti)
        for (const g of gorusler) {
          await fetch(`/api/alim/${form.alim_id}/gorusler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...g, kaynak_id: form.kaynak_id }),
          })
        }
        setMesaj(`✓ ${gorusler.length} görüş kaydedildi.`)
      } catch { setHata('Görüşler JSON formatında değil, manuel kontrol gerekiyor.') }
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-2">AI destekli içerik üretimi</h2>
      <p className="text-xs text-gray-400 mb-6">Kaynak metnini yapıştırın; Claude ISNAD 2 atıflarıyla içerik oluştursun.</p>
      <div className="space-y-4">
        <FormSatir label="Alim" required>
          <select className={selectCls} value={form.alim_id} onChange={e => set('alim_id', e.target.value)}>
            <option value="">— Seçin —</option>
            {alimler.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Üretim türü">
          <select className={selectCls} value={form.tur} onChange={e => set('tur', e.target.value)}>
            <option value="biyografi">Biyografi</option>
            <option value="gorus">Kelam görüşleri (JSON)</option>
            <option value="ozet">Metin özeti</option>
          </select>
        </FormSatir>
        <FormSatir label="Kaynak">
          <select className={selectCls} value={form.kaynak_id} onChange={e => set('kaynak_id', e.target.value)}>
            <option value="">— Kayıtlı kaynak seçin (isteğe bağlı) —</option>
            {kaynaklar.map(k => <option key={k.id} value={k.id}>{k.baslik} {k.yazar ? `— ${k.yazar}` : ''}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Kaynak metni">
          <textarea
            className={inputCls}
            rows={8}
            value={form.kaynak_metni}
            onChange={e => set('kaynak_metni', e.target.value)}
            placeholder="Kaynaktan ilgili metni buraya yapıştırın (Arapça veya Türkçe)..."
          />
        </FormSatir>
        <div className="flex justify-end">
          <button
            onClick={uret}
            disabled={uretiliyor}
            className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uretiliyor ? 'Üretiliyor...' : 'AI ile üret'}
          </button>
        </div>

        {cikti && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Üretilen içerik</p>
              <button onClick={kaydet} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Veritabanına kaydet
              </button>
            </div>
            <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {cikti}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Görüş Ekle ----------
function GorusEkleFormu({ setMesaj, setHata }) {
  const [alimler, setAlimler] = useState([])
  const [kaynaklar, setKaynaklar] = useState([])
  const [form, setForm] = useState({ alim_id: '', konu_basligi: '', konu_kategorisi: 'İlahiyât', icerik: '', kaynak_id: '', kaynak_sayfa: '', isnad_notu: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/alim').then(r => r.json()).then(setAlimler)
    fetch('/api/kaynak').then(r => r.json()).then(setKaynaklar)
  }, [])

  async function gonder(e) {
    e.preventDefault()
    const r = await fetch(`/api/alim/${form.alim_id}/gorusler`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const d = await r.json()
    if (d.basarili) { setMesaj('✓ Görüş eklendi.'); setForm({ alim_id: form.alim_id, konu_basligi: '', konu_kategorisi: 'İlahiyât', icerik: '', kaynak_id: '', kaynak_sayfa: '', isnad_notu: '' }) }
    else setHata('Hata.')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-6">Manuel görüş ekle</h2>
      <form onSubmit={gonder} className="space-y-4">
        <FormSatir label="Alim" required>
          <select className={selectCls} value={form.alim_id} onChange={e => set('alim_id', e.target.value)} required>
            <option value="">— Seçin —</option>
            {alimler.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Konu başlığı" required>
          <input className={inputCls} value={form.konu_basligi} onChange={e => set('konu_basligi', e.target.value)} placeholder="Teklif-i mâ lâ yûtâk" required />
        </FormSatir>
        <FormSatir label="Kategori">
          <select className={selectCls} value={form.konu_kategorisi} onChange={e => set('konu_kategorisi', e.target.value)}>
            {['İlahiyât', 'Nübüvvet', "Sem'iyyât", 'İmâmet', 'Diğer'].map(k => <option key={k}>{k}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Görüş metni" required>
          <textarea className={inputCls} rows={4} value={form.icerik} onChange={e => set('icerik', e.target.value)} required />
        </FormSatir>
        <FormSatir label="Kaynak">
          <select className={selectCls} value={form.kaynak_id} onChange={e => set('kaynak_id', e.target.value)}>
            <option value="">— Seçin —</option>
            {kaynaklar.map(k => <option key={k.id} value={k.id}>{k.baslik}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Sayfa">
          <input className={inputCls} value={form.kaynak_sayfa} onChange={e => set('kaynak_sayfa', e.target.value)} placeholder="s. 112" />
        </FormSatir>
        <FormSatir label="ISNAD notu">
          <input className={inputCls} value={form.isnad_notu} onChange={e => set('isnad_notu', e.target.value)} placeholder="Teftâzânî, Şerhu'l-Akāid, Kahire 1407, s. 112." />
        </FormSatir>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">Kaydet</button>
        </div>
      </form>
    </div>
  )
}

// ---------- Eser Ekle ----------
function EserEkleFormu({ setMesaj, setHata }) {
  const [alimler, setAlimler] = useState([])
  const [eserler, setEserler] = useState([])
  const [form, setForm] = useState({ ad: '', ad_arapca: '', alim_id: '', tur: 'telif', esas_eser_id: '', aciklama: '', isnad_bilgisi: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/alim').then(r => r.json()).then(setAlimler)
    fetch('/api/eser').then(r => r.json()).then(setEserler).catch(() => {})
  }, [])

  async function gonder(e) {
    e.preventDefault()
    const r = await fetch('/api/eser', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const d = await r.json()
    if (d.basarili) setMesaj(`✓ "${form.ad}" eklendi.`)
    else setHata('Hata.')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-6">Eser ekle</h2>
      <form onSubmit={gonder} className="space-y-4">
        <FormSatir label="Eser adı" required>
          <input className={inputCls} value={form.ad} onChange={e => set('ad', e.target.value)} required />
        </FormSatir>
        <FormSatir label="Arapça adı">
          <input className={inputCls + ' font-arabic'} dir="rtl" value={form.ad_arapca} onChange={e => set('ad_arapca', e.target.value)} />
        </FormSatir>
        <FormSatir label="Alim" required>
          <select className={selectCls} value={form.alim_id} onChange={e => set('alim_id', e.target.value)} required>
            <option value="">— Seçin —</option>
            {alimler.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Tür">
          <select className={selectCls} value={form.tur} onChange={e => set('tur', e.target.value)}>
            {['telif', 'serh', 'hasiye', 'talika', 'risale', 'diger'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Asıl eser (varsa)">
          <select className={selectCls} value={form.esas_eser_id} onChange={e => set('esas_eser_id', e.target.value)}>
            <option value="">— Bağımsız eser —</option>
            {eserler.map(e => <option key={e.id} value={e.id}>{e.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Açıklama">
          <textarea className={inputCls} rows={2} value={form.aciklama} onChange={e => set('aciklama', e.target.value)} />
        </FormSatir>
        <FormSatir label="ISNAD künye">
          <input className={inputCls} value={form.isnad_bilgisi} onChange={e => set('isnad_bilgisi', e.target.value)} placeholder="Teftâzânî. Şerhu'l-Akāid. Kahire 1407." />
        </FormSatir>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">Kaydet</button>
        </div>
      </form>
    </div>
  )
}

// ---------- İlişki Ekle ----------
function IliskiEkleFormu({ setMesaj, setHata }) {
  const [alimler, setAlimler] = useState([])
  const [form, setForm] = useState({ alim1_id: '', alim2_id: '', iliski_turu: 'hoca', aciklama: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { fetch('/api/alim').then(r => r.json()).then(setAlimler) }, [])

  async function gonder(e) {
    e.preventDefault()
    const r = await fetch('/api/iliski', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const d = await r.json()
    if (d.basarili) setMesaj('✓ İlişki eklendi.')
    else setHata('Hata.')
  }

  const turLabel = { hoca: 'Hoca → Öğrenci', ogrenci: 'Öğrenci → Hoca', muasir: 'Muasır', rakip: 'İlmî rakip', etkileyen: 'Etkilenme' }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-base font-medium text-gray-900 mb-6">Alim ilişkisi ekle</h2>
      <form onSubmit={gonder} className="space-y-4">
        <FormSatir label="1. Alim" required>
          <select className={selectCls} value={form.alim1_id} onChange={e => set('alim1_id', e.target.value)} required>
            <option value="">— Seçin —</option>
            {alimler.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="İlişki türü">
          <select className={selectCls} value={form.iliski_turu} onChange={e => set('iliski_turu', e.target.value)}>
            {Object.entries(turLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="2. Alim" required>
          <select className={selectCls} value={form.alim2_id} onChange={e => set('alim2_id', e.target.value)} required>
            <option value="">— Seçin —</option>
            {alimler.map(a => <option key={a.id} value={a.id}>{a.ad}</option>)}
          </select>
        </FormSatir>
        <FormSatir label="Açıklama">
          <input className={inputCls} value={form.aciklama} onChange={e => set('aciklama', e.target.value)} placeholder="Semerkand'da icazet verdi..." />
        </FormSatir>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">Kaydet</button>
        </div>
      </form>
    </div>
  )
}
