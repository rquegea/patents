import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { rawSearch } from '../services/lensApi.js';
import { extractTitle, extractAbstract, extractInventors, extractIPC } from '../services/patentProcessor.js';

const router = Router();

function buildApplicantQuery(nameVariants, watchedConcepts) {
  const must = [
    {
      bool: {
        should: nameVariants.map(alias => ({
          match_phrase: { "applicant.name": alias }
        })),
        minimum_should_match: 1
      }
    },
    {
      range: { date_published: { gte: "2000-01-01", lte: "2026-12-31" } }
    }
  ];

  if (watchedConcepts.length > 0) {
    must.push({
      query_string: {
        query: watchedConcepts.join(' OR '),
        fields: ["title", "abstract", "claims", "description"],
        default_operator: "or"
      }
    });
  }

  return {
    query: { bool: { must } },
    size: 100,
    sort: [{ date_published: "desc" }],
    include: [
      "lens_id", "jurisdiction", "date_published", "doc_number", "kind",
      "biblio.invention_title", "biblio.parties.applicants",
      "biblio.parties.inventors", "biblio.classifications_ipcr",
      "abstract", "publication_type"
    ]
  };
}

async function checkSingleCompetitor(id) {
  const db = getDb();
  const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id);
  if (!competitor) throw new Error('Competitor not found');

  const aliases = JSON.parse(competitor.aliases || '[]');
  const concepts = JSON.parse(competitor.watched_concepts || '[]');
  const nameVariants = [competitor.name, ...aliases];

  const lensData = await rawSearch(buildApplicantQuery(nameVariants, concepts));
  const rawPatents = lensData.data || lensData.results || [];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO competitor_patents
      (competitor_id, lens_id, title, abstract, jurisdiction, date_published,
       publication_type, inventors, ipc_codes, lens_url, is_new)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  let newCount = 0;
  const newList = [];

  const insertMany = db.transaction(() => {
    for (const patent of rawPatents) {
      const title = extractTitle(patent.biblio?.invention_title);
      const abstract = extractAbstract(patent.abstract);
      const inventors = extractInventors(patent.biblio?.parties?.inventors);
      const ipcCodes = extractIPC(patent.biblio?.classifications_ipcr);
      const lensUrl = `https://www.lens.org/lens/patent/${patent.lens_id}`;

      const result = insertStmt.run(
        id,
        patent.lens_id,
        title,
        abstract,
        patent.jurisdiction || '',
        patent.date_published || '',
        patent.publication_type || '',
        JSON.stringify(inventors),
        JSON.stringify(ipcCodes),
        lensUrl
      );

      if (result.changes > 0) {
        newCount++;
        newList.push({ lensId: patent.lens_id, title, jurisdiction: patent.jurisdiction, datePublished: patent.date_published, lensUrl });
      }
    }
  });

  insertMany();

  const totalCount = db.prepare('SELECT COUNT(*) as c FROM competitor_patents WHERE competitor_id = ?').get(id).c;
  const newPatentsCount = db.prepare('SELECT COUNT(*) as c FROM competitor_patents WHERE competitor_id = ? AND is_new = 1').get(id).c;

  db.prepare(`
    UPDATE competitors
    SET last_checked = datetime('now'), total_patents = ?, new_patents = ?
    WHERE id = ?
  `).run(totalCount, newPatentsCount, id);

  return { total_patents: totalCount, new_patents: newPatentsCount, new_count: newCount, new_list: newList };
}

// GET /api/competitors — list all
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM competitors ORDER BY created_at DESC').all();
    res.json(rows.map(r => ({
      ...r,
      aliases: JSON.parse(r.aliases || '[]'),
      watched_concepts: JSON.parse(r.watched_concepts || '[]')
    })));
  } catch (err) { next(err); }
});

// POST /api/competitors — create
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { name, aliases = [], competitor_type = 'competitor', watched_concepts = [], notes = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const result = db.prepare(`
      INSERT INTO competitors (name, aliases, competitor_type, watched_concepts, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), JSON.stringify(aliases), competitor_type, JSON.stringify(watched_concepts), notes);

    const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...row,
      aliases: JSON.parse(row.aliases || '[]'),
      watched_concepts: JSON.parse(row.watched_concepts || '[]')
    });
  } catch (err) { next(err); }
});

// POST /api/competitors/check-all — MUST be before /:id
router.post('/check-all', async (req, res, next) => {
  try {
    const db = getDb();
    const competitors = db.prepare('SELECT id, name FROM competitors ORDER BY created_at ASC').all();
    const results = [];

    for (const c of competitors) {
      try {
        const result = await checkSingleCompetitor(c.id);
        results.push({ id: c.id, name: c.name, ...result });
      } catch (err) {
        results.push({ id: c.id, name: c.name, error: err.message });
      }
      if (competitors.indexOf(c) < competitors.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    res.json({ checked: competitors.length, results });
  } catch (err) { next(err); }
});

// GET /api/competitors/feed — MUST be before /:id
router.get('/feed', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT cp.*, c.name as competitor_name, c.competitor_type
      FROM competitor_patents cp
      JOIN competitors c ON cp.competitor_id = c.id
      WHERE cp.is_new = 1
      ORDER BY cp.date_published DESC
      LIMIT 100
    `).all();
    res.json(rows.map(r => ({
      ...r,
      inventors: JSON.parse(r.inventors || '[]'),
      ipc_codes: JSON.parse(r.ipc_codes || '[]')
    })));
  } catch (err) { next(err); }
});

// GET /api/competitors/:id/patents
router.get('/:id/patents', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const newOnly = req.query.new_only === 'true';
    const where = newOnly ? 'WHERE competitor_id = ? AND is_new = 1' : 'WHERE competitor_id = ?';
    const rows = db.prepare(`SELECT * FROM competitor_patents ${where} ORDER BY date_published DESC`).all(id);
    res.json(rows.map(r => ({
      ...r,
      inventors: JSON.parse(r.inventors || '[]'),
      ipc_codes: JSON.parse(r.ipc_codes || '[]')
    })));
  } catch (err) { next(err); }
});

// POST /api/competitors/:id/check
router.post('/:id/check', async (req, res, next) => {
  try {
    const result = await checkSingleCompetitor(parseInt(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/competitors/:id/mark-seen
router.post('/:id/mark-seen', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('UPDATE competitor_patents SET is_new = 0 WHERE competitor_id = ?').run(id);
    db.prepare('UPDATE competitors SET new_patents = 0 WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT /api/competitors/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, aliases = [], competitor_type = 'competitor', watched_concepts = [], notes = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    db.prepare(`
      UPDATE competitors SET name = ?, aliases = ?, competitor_type = ?, watched_concepts = ?, notes = ?
      WHERE id = ?
    `).run(name.trim(), JSON.stringify(aliases), competitor_type, JSON.stringify(watched_concepts), notes, id);

    const row = db.prepare('SELECT * FROM competitors WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...row,
      aliases: JSON.parse(row.aliases || '[]'),
      watched_concepts: JSON.parse(row.watched_concepts || '[]')
    });
  } catch (err) { next(err); }
});

// DELETE /api/competitors/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM competitors WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
