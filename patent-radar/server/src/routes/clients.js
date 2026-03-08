import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { rawSearch } from '../services/lensApi.js';
import { extractTitle, extractAbstract, extractIPC } from '../services/patentProcessor.js';

const router = Router();

function parsePatent(row) {
  return {
    ...row,
    key_claims: JSON.parse(row.key_claims || '[]'),
    technology_keywords: JSON.parse(row.technology_keywords || '[]'),
    raw_data: row.raw_data ? JSON.parse(row.raw_data) : {}
  };
}

// GET /api/clients
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/clients
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { name, sector = '', country = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const result = db.prepare(
      'INSERT INTO clients (name, sector, country) VALUES (?, ?, ?)'
    ).run(name.trim(), sector, country);

    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// GET /api/clients/:id
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return res.status(404).json({ error: 'Not found' });

    const patents = db.prepare('SELECT * FROM client_patents WHERE client_id = ? ORDER BY created_at DESC').all(id);
    res.json({ ...client, patents: patents.map(parsePatent) });
  } catch (err) { next(err); }
});

// PUT /api/clients/:id
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, sector = '', country = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    db.prepare('UPDATE clients SET name = ?, sector = ?, country = ? WHERE id = ?')
      .run(name.trim(), sector, country, id);

    const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/clients/:id/patents
router.get('/:id/patents', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM client_patents WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);
    res.json(rows.map(parsePatent));
  } catch (err) { next(err); }
});

// POST /api/clients/:id/patents
router.post('/:id/patents', (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      patent_number, title, claims_summary, key_claims = [],
      technology_keywords = [], filing_date, status = 'unknown'
    } = req.body;

    const result = db.prepare(`
      INSERT INTO client_patents
        (client_id, patent_number, title, claims_summary, key_claims, technology_keywords, filing_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, patent_number, title, claims_summary,
      JSON.stringify(key_claims), JSON.stringify(technology_keywords),
      filing_date, status
    );

    const row = db.prepare('SELECT * FROM client_patents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parsePatent(row));
  } catch (err) { next(err); }
});

// POST /api/clients/:id/patents/search-by-applicant
router.post('/:id/patents/search-by-applicant', async (req, res, next) => {
  try {
    const { applicant_name, size = 20 } = req.body;
    if (!applicant_name?.trim()) return res.status(400).json({ error: 'applicant_name is required' });

    const lensData = await rawSearch({
      query: {
        bool: {
          must: [{
            match_phrase: { 'applicant.name': applicant_name.trim() }
          }]
        }
      },
      size,
      sort: [{ date_published: 'desc' }],
      include: [
        'lens_id', 'jurisdiction', 'date_published', 'doc_number', 'kind',
        'biblio.invention_title', 'biblio.parties.applicants',
        'biblio.classifications_ipcr', 'abstract', 'publication_type', 'legal_status'
      ]
    });

    const rawPatents = lensData.data || lensData.results || [];
    const patents = rawPatents.map(p => ({
      lens_id: p.lens_id,
      doc_number: p.doc_number,
      jurisdiction: p.jurisdiction,
      title: extractTitle(p.biblio?.invention_title),
      abstract: extractAbstract(p.abstract),
      date_published: p.date_published,
      status: p.legal_status?.patent_status || 'unknown',
      publication_type: p.publication_type,
      ipc_codes: extractIPC(p.biblio?.classifications_ipcr),
      raw_data: p,
    }));

    res.json({ patents, total: lensData.total || rawPatents.length });
  } catch (err) { next(err); }
});

// POST /api/clients/:id/patents/lookup
router.post('/:id/patents/lookup', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { patent_number } = req.body;

    const lensData = await rawSearch({
      query: {
        bool: {
          must: [{ match: { doc_number: patent_number } }]
        }
      },
      size: 5,
      include: [
        'lens_id', 'jurisdiction', 'date_published', 'doc_number',
        'biblio.invention_title', 'biblio.parties.applicants',
        'biblio.parties.inventors', 'biblio.classifications_ipcr',
        'abstract', 'publication_type', 'legal_status', 'families'
      ]
    });

    const rawPatents = lensData.data || lensData.results || [];
    if (rawPatents.length === 0) return res.status(404).json({ error: 'Patent not found in Lens.org' });

    const rawPatent = rawPatents[0];
    const title = extractTitle(rawPatent.biblio?.invention_title);
    const claims_summary = extractAbstract(rawPatent.abstract);
    const ipcCodes = extractIPC(rawPatent.biblio?.classifications_ipcr);

    const result = db.prepare(`
      INSERT OR REPLACE INTO client_patents
        (client_id, patent_number, title, claims_summary, technology_keywords,
         filing_date, status, source, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'lens', ?)
    `).run(
      id, patent_number, title, claims_summary,
      JSON.stringify(ipcCodes),
      rawPatent.date_published || '',
      rawPatent.legal_status?.patent_status || 'unknown',
      JSON.stringify(rawPatent)
    );

    const row = db.prepare('SELECT * FROM client_patents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parsePatent(row));
  } catch (err) { next(err); }
});

// DELETE /api/clients/:id/patents/:patentId
router.delete('/:id/patents/:patentId', (req, res, next) => {
  try {
    const db = getDb();
    const { id, patentId } = req.params;
    console.log(`[DELETE patent] client=${id} patent=${patentId}`);
    const result = db.prepare('DELETE FROM client_patents WHERE id = ? AND client_id = ?')
      .run(patentId, id);
    console.log(`[DELETE patent] changes=${result.changes}`);
    res.json({ ok: true, deleted: result.changes > 0 });
  } catch (err) {
    console.error('[DELETE patent] ERROR:', err.message, err.stack);
    next(err);
  }
});

// POST /api/clients/:id/patents/:patentId/extract-keywords
router.post('/:id/patents/:patentId/extract-keywords', async (req, res, next) => {
  try {
    const db = getDb();
    const patent = db.prepare(
      'SELECT * FROM client_patents WHERE id = ? AND client_id = ?'
    ).get(req.params.patentId, req.params.id);
    if (!patent) return res.status(404).json({ error: 'Patent not found' });

    const key_claims = JSON.parse(patent.key_claims || '[]');

    let keywords, search_queries;

    if (!process.env.ANTHROPIC_API_KEY) {
      const stopwords = new Set(['the','a','an','of','in','for','and','or','to','with','by','on','at','is','are','that','this','which','be','from']);
      keywords = (patent.title || '').split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w.toLowerCase()));
      search_queries = keywords.length > 0 ? [`${keywords.slice(0, 3).join(' AND ')}`] : [];
    } else {
      const userMessage = [
        `Título: ${patent.title || ''}`,
        `Resumen de claims: ${patent.claims_summary || ''}`,
        `Claims clave: ${key_claims.join('; ')}`
      ].join('\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: 'You are a patent technology expert. Extract the key technological concepts from this patent. CRITICAL: All keywords and search_queries MUST be in English, even if the patent text is in another language. Translate all concepts to their standard English technical terms. Respond ONLY in valid JSON without markdown: { "keywords": ["keyword1", ...], "search_queries": ["query1 AND query2", ...] }',
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text || '{}';
      // Strip markdown fences if present (```json ... ```)
      const text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      let parsed = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse Claude response:', rawText);
      }
      keywords = parsed.keywords || [];
      search_queries = parsed.search_queries || [];
    }

    db.prepare('UPDATE client_patents SET technology_keywords = ? WHERE id = ?')
      .run(JSON.stringify(keywords), patent.id);

    res.json({ keywords, search_queries });
  } catch (err) { next(err); }
});

export default router;
