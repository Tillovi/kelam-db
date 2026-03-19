// node lib/init-db.cjs
const { createClient } = require('@libsql/client')
const path = require('path')
const fs = require('fs')

const dir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = createClient({ url: 'file:' + path.join(dir, 'kelam.db') })

async function main() {
  // Tablolar
  await db.execute(`CREATE TABLE IF NOT EXISTS ekoller (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL,
    ad_arapca TEXT, renk_kodu TEXT DEFAULT '#6B7280', aciklama TEXT,
    olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS alimler (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL,
    ad_arapca TEXT, ad_latinize TEXT, lakap TEXT,
    vefat_hicri TEXT, vefat_miladi INTEGER,
    dogum_hicri TEXT, dogum_miladi INTEGER,
    dogum_yeri TEXT, vefat_yeri TEXT,
    ekol_id INTEGER, mezhep TEXT, biyografi TEXT,
    enlem REAL, boylam REAL, gorsel_url TEXT,
    olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS eserler (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ad TEXT NOT NULL,
    ad_arapca TEXT, alim_id INTEGER, tur TEXT,
    esas_eser_id INTEGER, telif_tarihi_hicri TEXT,
    telif_tarihi_miladi INTEGER, aciklama TEXT,
    dosya_yolu TEXT, isnad_bilgisi TEXT,
    olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS alim_iliskileri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alim1_id INTEGER, alim2_id INTEGER,
    iliski_turu TEXT, aciklama TEXT)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS kaynaklar (
    id INTEGER PRIMARY KEY AUTOINCREMENT, baslik TEXT NOT NULL,
    yazar TEXT, yayin_yili INTEGER, yayin_yeri TEXT,
    dosya_yolu TEXT, tur TEXT, dil TEXT DEFAULT 'ar',
    notlar TEXT, olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS gorusler (
    id INTEGER PRIMARY KEY AUTOINCREMENT, alim_id INTEGER,
    konu_basligi TEXT NOT NULL, konu_kategorisi TEXT,
    icerik TEXT NOT NULL, kaynak_id INTEGER,
    kaynak_sayfa TEXT, isnad_notu TEXT,
    olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP,
    guncelleme DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS konu_basliklari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ustbaslik_id INTEGER, ad TEXT NOT NULL,
    ad_arapca TEXT, sira INTEGER, aciklama TEXT)`)

  await db.execute(`CREATE TABLE IF NOT EXISTS kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_adi TEXT NOT NULL UNIQUE,
    sifre_hash TEXT NOT NULL, ad TEXT,
    rol TEXT DEFAULT 'editor', aktif INTEGER DEFAULT 1,
    son_giris DATETIME,
    olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP)`)

  // Ekoller
  const { rows: er } = await db.execute('SELECT COUNT(*) as n FROM ekoller')
  if (Number(er[0].n) === 0) {
    for (const [ad, ar, renk] of [
      ['Maturidiyye','الماتريدية','#7C3AED'],
      ["Es'ariyye",'الأشعرية','#059669'],
      ["Mu'tezile",'المعتزلة','#D97706'],
      ['Zeydiyye','الزيدية','#DC2626'],
      ['Imamiyye','الإمامية','#2563EB'],
      ['Selefiyye','السلفية','#6B7280'],
    ]) await db.execute({ sql: 'INSERT INTO ekoller (ad,ad_arapca,renk_kodu) VALUES (?,?,?)', args:[ad,ar,renk] })
    console.log('Ekoller eklendi.')
  }

  // Konu başlıkları
  const { rows: kr } = await db.execute('SELECT COUNT(*) as n FROM konu_basliklari')
  if (Number(kr[0].n) === 0) {
    for (const [ust,ad,ar,sira] of [
      [null,'Ilahiyat','الإلهيات',1],[null,'Nubuvvet','النبوات',2],
      [null,'Semiyyat','السمعيات',3],[null,'Imamet','الإمامة',4],
      [1,'Zat ve Sifatlar','الذات والصفات',1],
      [1,'Ilahi Fiiller','الأفعال الإلهية',2],
      [1,'Teklif-i ma la yuttak','تكليف ما لا يطاق',3],
      [1,'Kader ve Irade','القضاء والقدر',4],
      [2,'Ismet','العصمة',1],[2,'Mucize','المعجزة',2],
    ]) await db.execute({ sql:'INSERT INTO konu_basliklari (ustbaslik_id,ad,ad_arapca,sira) VALUES (?,?,?,?)', args:[ust,ad,ar,sira] })
    console.log('Konu başlıkları eklendi.')
  }

  // Demo alim
  const { rows: ar2 } = await db.execute('SELECT COUNT(*) as n FROM alimler')
  if (Number(ar2[0].n) === 0) {
    const { lastInsertRowid: aid } = await db.execute({
      sql:`INSERT INTO alimler (ad,ad_arapca,ad_latinize,vefat_hicri,vefat_miladi,dogum_yeri,vefat_yeri,ekol_id,mezhep,biyografi,enlem,boylam)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      args:["Teftazani","التفتازاني","Sa'duddin Mes'ud et-Teftazani",
        "792",1390,"Teftazan/Horasan","Semerkand",1,"Hanef",
        "Horasan'in Teftazan kasabasinda dogdu. Kelam, usul-i fikih ve belagat alanlarinin onde gelen alimlerindendi.",
        39.6542,66.9597]
    })
    const { lastInsertRowid: eid } = await db.execute({
      sql:'INSERT INTO eserler (ad,ad_arapca,alim_id,tur,aciklama,isnad_bilgisi) VALUES (?,?,?,?,?,?)',
      args:["Serhu'l-Akaid","شرح العقائد النسفية",aid,"serh","Nesefi'nin Akaid serhidir.","Teftazani. Serhu'l-Akaid. Kahire 1407."]
    })
    const { lastInsertRowid: kid } = await db.execute({
      sql:'INSERT INTO kaynaklar (baslik,yazar,yayin_yili,yayin_yeri,tur,dil) VALUES (?,?,?,?,?,?)',
      args:["Serhu'l-Akaid","Teftazani",1407,"Kahire","birincil","ar"]
    })
    await db.execute({
      sql:'INSERT INTO gorusler (alim_id,konu_basligi,konu_kategorisi,icerik,kaynak_id,kaynak_sayfa,isnad_notu) VALUES (?,?,?,?,?,?,?)',
      args:[aid,"Teklif-i ma la yuttak","Ilahi Fiiller",
        "Allah'in guc yetirilemeyeni teklif etmesi aklen caizdir; ancak ilahi hikmet geregi ser'an vukuu yoktur.",
        kid,"s.112-115","Teftazani. Serhu'l-Akaid. Kahire 1407, s.112."]
    })

    // Hayali
    const { lastInsertRowid: hid } = await db.execute({
      sql:'INSERT INTO alimler (ad,ad_arapca,ad_latinize,vefat_hicri,vefat_miladi,ekol_id,mezhep) VALUES (?,?,?,?,?,?,?)',
      args:["Hayali","الحيالي","Ahmed b. Musa el-Hayali","875",1470,1,"Hanef"]
    })
    await db.execute({
      sql:'INSERT INTO eserler (ad,ad_arapca,alim_id,tur,esas_eser_id,aciklama) VALUES (?,?,?,?,?,?)',
      args:["Hasiye ala Serhi'l-Akaid","حاشية على شرح العقائد",hid,"hasiye",eid,"Teftazani serhine hasiye."]
    })

    // Curcani
    const { lastInsertRowid: cid } = await db.execute({
      sql:'INSERT INTO alimler (ad,ad_arapca,ad_latinize,vefat_hicri,vefat_miladi,ekol_id,mezhep,vefat_yeri,enlem,boylam) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args:["Curcani","الجرجاني","Seyyid Serif el-Curcani","816",1413,2,"Safi","Shiraz",29.5918,52.5836]
    })
    await db.execute({
      sql:'INSERT INTO alim_iliskileri (alim1_id,alim2_id,iliski_turu,aciklama) VALUES (?,?,?,?)',
      args:[aid,cid,"muasir","Semerkand'da ilmi munazaralari ile taninan muasirlar"]
    })
    console.log('Demo veriler eklendi.')
  }

  // Admin kullanicisi
  const { rows: ur } = await db.execute('SELECT COUNT(*) as n FROM kullanicilar')
  if (Number(ur[0].n) === 0) {
    // bcrypt hash of "kelam2024"
    await db.execute({
      sql:'INSERT INTO kullanicilar (kullanici_adi,sifre_hash,ad,rol) VALUES (?,?,?,?)',
      args:['admin','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','Sistem Yoneticisi','admin']
    })
    console.log('Admin kullanicisi olusturuldu: admin / kelam2024')
  }

  console.log('\nVeritabani hazir: data/kelam.db')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
