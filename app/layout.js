import './globals.css'
export const metadata = { title: 'Kelam Literatürü Veritabanı' }

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <a href="/" className="text-base font-medium text-gray-900">Kelam Literatürü</a>
            <nav className="flex items-center gap-1 flex-wrap">
              <a href="/"           className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Alimler</a>
              <a href="/arama"      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Arama</a>
              <a href="/sistematik" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Sistematik</a>
              <a href="/harita"     className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Harita</a>
              <a href="/zaman"      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Zaman</a>
              <a href="/ag"         className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">İlişki ağı</a>
              <a href="/kaynak-yukle" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">Kaynak yükle</a>
              <a href="/admin"      className="ml-2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-8">
          <p className="text-center text-xs text-gray-400">Kelam Literatürü Veritabanı · ISNAD 2</p>
        </footer>
      </body>
    </html>
  )
}
