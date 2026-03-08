import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { searchPatents } from '../services/lensApi.js';
import { processPatentResults } from '../services/patentProcessor.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const alerts = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM alert_results ar WHERE ar.alert_id = a.id) as total_found
      FROM alerts a
      ORDER BY a.created_at DESC
    `).all();

    res.json(alerts.map(a => ({
      id: a.id,
      name: a.name,
      query: a.query_text,
      filters: a.filters_json ? JSON.parse(a.filters_json) : {},
      lastCheckedAt: a.last_checked_at,
      lastResultCount: a.last_result_count,
      totalFound: a.total_found,
      isActive: !!a.is_active,
      createdAt: a.created_at
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { name, query, filters = {} } = req.body;

    if (!name || !query) {
      return res.status(400).json({ error: 'Name and query are required' });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO alerts (name, query_text, filters_json)
      VALUES (?, ?, ?)
    `).run(name, query, JSON.stringify(filters));

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      query,
      filters,
      isActive: true,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, query, filters, isActive } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Alert not found' });

    db.prepare(`
      UPDATE alerts SET
        name = COALESCE(?, name),
        query_text = COALESCE(?, query_text),
        filters_json = COALESCE(?, filters_json),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      name || null,
      query || null,
      filters ? JSON.stringify(filters) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      req.params.id
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/check', async (req, res, next) => {
  try {
    const db = getDb();
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const filters = alert.filters_json ? JSON.parse(alert.filters_json) : {};
    const rawResults = await searchPatents(alert.query_text, filters);
    const processed = processPatentResults(rawResults);

    // Find new patents not yet in alert_results
    const existingIds = db.prepare(
      'SELECT lens_id FROM alert_results WHERE alert_id = ?'
    ).all(alert.id).map(r => r.lens_id);

    const existingSet = new Set(existingIds);
    const newPatents = processed.patents.filter(p => !existingSet.has(p.lensId));

    // Store new results
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO alert_results (alert_id, lens_id, title, jurisdiction, date_published)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const p of newPatents) {
      insertStmt.run(alert.id, p.lensId, p.title, p.jurisdiction, p.datePublished);
    }

    // Update alert metadata
    db.prepare(`
      UPDATE alerts SET last_checked_at = datetime('now'), last_result_count = ?
      WHERE id = ?
    `).run(processed.total, alert.id);

    res.json({
      totalResults: processed.total,
      newPatents: newPatents.length,
      newPatentsList: newPatents.slice(0, 20),
      mock: rawResults.mock || false
    });
  } catch (err) {
    next(err);
  }
});

export default router;
