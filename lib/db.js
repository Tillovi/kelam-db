import { createClient } from '@libsql/client'
import path from 'path'
import fs from 'fs'

let _db = null

export function getDb() {
  if (_db) return _db
  if (process.env.TURSO_DB_URL) {
    _db = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  } else {
    const dir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    _db = createClient({ url: 'file:' + path.join(dir, 'kelam.db') })
  }
  return _db
}
