import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.resolve(process.cwd(), '../../data')
const DB_PATH = path.join(DATA_DIR, 'travel.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
db.exec(schema)

export default db
