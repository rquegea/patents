import { getDb } from '../db/schema.js';

export function getCachedSearch(queryText, filtersJson) {
  const db = getDb();
  const row = db.prepare(`
    SELECT results_json, result_count FROM searches
    WHERE query_text = ? AND filters_json = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(queryText, filtersJson);

  if (row) {
    return JSON.parse(row.results_json);
  }
  return null;
}

export function setCachedSearch(queryText, filtersJson, results, resultCount) {
  const db = getDb();
  db.prepare(`
    INSERT INTO searches (query_text, filters_json, results_json, result_count)
    VALUES (?, ?, ?, ?)
  `).run(queryText, filtersJson, JSON.stringify(results), resultCount);
}

export function getSearchHistory(limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT id, query_text, filters_json, result_count, created_at
    FROM searches
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

export function cleanExpiredCache() {
  const db = getDb();
  db.prepare(`DELETE FROM searches WHERE expires_at < datetime('now')`).run();
}
