import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'data', 'patent-radar.db');

let db;

export function getDb() {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_text TEXT NOT NULL,
      filters_json TEXT,
      results_json TEXT,
      result_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT DEFAULT (datetime('now', '+1 hour'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      query_text TEXT NOT NULL,
      filters_json TEXT,
      last_checked_at TEXT,
      last_result_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
      lens_id TEXT NOT NULL,
      title TEXT,
      jurisdiction TEXT,
      date_published TEXT,
      found_at TEXT DEFAULT (datetime('now')),
      UNIQUE(alert_id, lens_id)
    );

    CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query_text, filters_json);
    CREATE INDEX IF NOT EXISTS idx_searches_expires ON searches(expires_at);
    CREATE INDEX IF NOT EXISTS idx_alert_results_alert ON alert_results(alert_id);

    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aliases TEXT DEFAULT '[]',
      competitor_type TEXT DEFAULT 'competitor',
      watched_concepts TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      last_checked DATETIME,
      total_patents INTEGER DEFAULT 0,
      new_patents INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_patents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER REFERENCES competitors(id) ON DELETE CASCADE,
      lens_id TEXT NOT NULL,
      title TEXT,
      abstract TEXT,
      jurisdiction TEXT,
      date_published TEXT,
      publication_type TEXT,
      inventors TEXT DEFAULT '[]',
      ipc_codes TEXT DEFAULT '[]',
      lens_url TEXT,
      is_new INTEGER DEFAULT 1,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(competitor_id, lens_id)
    );

    CREATE INDEX IF NOT EXISTS idx_comp_patents_new ON competitor_patents(competitor_id, is_new);
    CREATE INDEX IF NOT EXISTS idx_comp_patents_date ON competitor_patents(date_published DESC);
  `);
}

export default getDb;
