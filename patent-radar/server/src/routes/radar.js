import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { rawSearch } from '../services/lensApi.js';
import { extractTitle, extractAbstract, extractIPC } from '../services/patentProcessor.js';

const router = Router({ mergeParams: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSearchQueries(keywords) {
  const queries = new Set();

  if (keywords.length >= 3) {
    queries.add(`${keywords[0]} AND ${keywords[1]} AND ${keywords[2]}`);
  }

  for (let i = 0; i < keywords.length && queries.size < 10; i++) {
    for (let j = i + 1; j < keywords.length && queries.size < 10; j++) {
      queries.add(`${keywords[i]} AND ${keywords[j]}`);
    }
  }

  return [...queries].slice(0, 10);
}

function buildLensQuery(queryStr) {
  return {
    query: {
      bool: {
        must: [
          {
            query_string: {
              query: queryStr,
              fields: ['title', 'abstract', 'claims'],
              default_operator: 'and'
            }
          },
          {
            range: { date_published: { gte: '2020-01-01' } }
          }
        ]
      }
    },
    size: 50,
    sort: [{ date_published: 'desc' }],
    include: [
      'lens_id', 'jurisdiction', 'date_published', 'doc_number',
      'biblio.invention_title', 'biblio.parties.applicants',
      'biblio.parties.inventors', 'biblio.classifications_ipcr',
      'abstract', 'publication_type'
    ]
  };
}

function extractApplicantNames(patent) {
  const applicants = patent.biblio?.parties?.applicants || [];
  return applicants.map(a =>
    a.extracted_name?.value ||
    a.applicant_name?.last_name ||
    a.applicant_name?.name ||
    ''
  ).filter(Boolean);
}

function normalizeApplicantName(name) {
  return name.trim().toLowerCase().replace(/[.,\s]+$/, '');
}

function mockCompetitors(scanId, db) {
  const mockData = [
    { applicant_name: 'Alltech Inc.', country: 'US', patent_count: 8 },
    { applicant_name: 'Adisseo France SAS', country: 'FR', patent_count: 6 },
    { applicant_name: 'Evonik GmbH', country: 'DE', patent_count: 5 },
    { applicant_name: 'Kemin Industries', country: 'US', patent_count: 4 },
    { applicant_name: 'Novus International', country: 'US', patent_count: 2 }
  ];

  const stmt = db.prepare(`
    INSERT INTO discovered_competitors
      (scan_id, applicant_name, country, patent_count, patent_ids)
    VALUES (?, ?, ?, ?, '[]')
  `);

  const inserted = db.transaction(() =>
    mockData.map(c => {
      const result = stmt.run(scanId, c.applicant_name, c.country, c.patent_count);
      return { id: result.lastInsertRowid, ...c, patent_ids: [] };
    })
  )();

  return inserted;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/clients/:id/radar/scan
router.post('/:id/radar/scan', async (req, res, next) => {
  const db = getDb();
  let scanId = null;

  try {
    const { id } = req.params;

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    // a) Aggregate all technology_keywords from client patents
    const patents = db.prepare('SELECT technology_keywords FROM client_patents WHERE client_id = ?').all(id);
    const keywordSet = new Set();
    for (const p of patents) {
      const kws = JSON.parse(p.technology_keywords || '[]');
      kws.forEach(k => { if (k?.trim()) keywordSet.add(k.trim()); });
    }

    // b) Guard: no keywords
    if (keywordSet.size === 0) {
      return res.status(400).json({ error: 'No hay keywords. Extrae keywords de las patentes primero.' });
    }

    // Filter out IPC classification codes (e.g. C08K5/49) — not searchable in text fields
    const IPC_RE = /^[A-H]\d{2}[A-Z]\d+\/\d+$/i;
    const semanticKeywords = [...keywordSet].filter(k => !IPC_RE.test(k.trim()));

    // Fall back to all keywords if everything got filtered (shouldn't happen after AI extraction)
    const keywords = semanticKeywords.length >= 2 ? semanticKeywords : [...keywordSet];
    const queries = buildSearchQueries(keywords);

    // d) Create radar_scan record
    const scanResult = db.prepare(`
      INSERT INTO radar_scans (client_id, search_queries, status, started_at)
      VALUES (?, ?, 'running', datetime('now'))
    `).run(id, JSON.stringify(queries));
    scanId = scanResult.lastInsertRowid;

    // Mock mode when no Lens token
    if (!process.env.LENS_API_TOKEN) {
      const competitors = mockCompetitors(scanId, db);
      db.prepare(`
        UPDATE radar_scans
        SET status='completed', total_results=?, competitors_found=?, completed_at=datetime('now')
        WHERE id=?
      `).run(15, competitors.length, scanId);

      return res.json({
        scanId,
        totalPatents: 15,
        competitorsFound: competitors.length,
        competitors
      });
    }

    // e–g) Real scan: fetch, deduplicate by lens_id
    const seen = new Map(); // lens_id → patent

    for (let i = 0; i < queries.length; i++) {
      try {
        const lensData = await rawSearch(buildLensQuery(queries[i]));
        const results = lensData.data || lensData.results || [];
        for (const patent of results) {
          if (patent.lens_id && !seen.has(patent.lens_id)) {
            seen.set(patent.lens_id, patent);
          }
        }
      } catch (_) { /* skip failed queries */ }

      if (i < queries.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // h) Filter own client's patents
    const clientNameLower = client.name.toLowerCase();
    const filtered = [...seen.values()].filter(patent => {
      const applicants = extractApplicantNames(patent);
      return !applicants.some(a => a.toLowerCase().includes(clientNameLower));
    });

    // i) Group by normalized applicant name
    const applicantMap = new Map(); // normalizedName → { name, country, lensIds }
    for (const patent of filtered) {
      const applicants = extractApplicantNames(patent);
      const country = patent.jurisdiction || '';

      for (const name of applicants) {
        const key = normalizeApplicantName(name);
        if (!applicantMap.has(key)) {
          applicantMap.set(key, { name, country, lensIds: new Set() });
        }
        applicantMap.get(key).lensIds.add(patent.lens_id);
      }
    }

    // j) Save discovered_competitors
    const insertComp = db.prepare(`
      INSERT INTO discovered_competitors
        (scan_id, applicant_name, country, patent_count, patent_ids)
      VALUES (?, ?, ?, ?, ?)
    `);

    const competitors = db.transaction(() => {
      const list = [];
      for (const [, data] of applicantMap) {
        const lensIds = [...data.lensIds];
        const result = insertComp.run(
          scanId, data.name, data.country, lensIds.length, JSON.stringify(lensIds)
        );
        list.push({
          id: result.lastInsertRowid,
          applicant_name: data.name,
          country: data.country,
          patent_count: lensIds.length,
          patent_ids: lensIds
        });
      }
      return list.sort((a, b) => b.patent_count - a.patent_count);
    })();

    // k) Update scan record
    db.prepare(`
      UPDATE radar_scans
      SET status='completed', total_results=?, competitors_found=?, completed_at=datetime('now')
      WHERE id=?
    `).run(filtered.length, competitors.length, scanId);

    // l) Return result
    res.json({
      scanId,
      totalPatents: filtered.length,
      competitorsFound: competitors.length,
      competitors
    });

  } catch (err) {
    if (scanId) {
      try {
        db.prepare(`UPDATE radar_scans SET status='failed', completed_at=datetime('now') WHERE id=?`).run(scanId);
      } catch (_) {}
    }
    next(err);
  }
});

// GET /api/clients/:id/radar/scans
router.get('/:id/radar/scans', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM radar_scans WHERE client_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json(rows.map(r => ({
      ...r,
      search_queries: JSON.parse(r.search_queries || '[]')
    })));
  } catch (err) { next(err); }
});

// GET /api/clients/:id/radar/scans/:scanId
router.get('/:id/radar/scans/:scanId', (req, res, next) => {
  try {
    const db = getDb();
    const { id, scanId } = req.params;

    const scan = db.prepare('SELECT * FROM radar_scans WHERE id = ? AND client_id = ?').get(scanId, id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const competitors = db.prepare(`
      SELECT * FROM discovered_competitors WHERE scan_id = ? ORDER BY patent_count DESC
    `).all(scanId);

    res.json({
      ...scan,
      search_queries: JSON.parse(scan.search_queries || '[]'),
      competitors: competitors.map(c => ({
        ...c,
        patent_ids: JSON.parse(c.patent_ids || '[]')
      }))
    });
  } catch (err) { next(err); }
});

// POST /api/clients/:id/radar/scans/:scanId/import/:discoveredId
router.post('/:id/radar/scans/:scanId/import/:discoveredId', (req, res, next) => {
  try {
    const db = getDb();
    const { scanId, discoveredId } = req.params;

    const discovered = db.prepare('SELECT * FROM discovered_competitors WHERE id = ?').get(discoveredId);
    if (!discovered) return res.status(404).json({ error: 'Discovered competitor not found' });

    const result = db.prepare(`
      INSERT INTO competitors (name, competitor_type, auto_discovered, discovered_from_scan)
      VALUES (?, 'competitor', 1, ?)
    `).run(discovered.applicant_name, scanId);

    const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      ...competitor,
      aliases: JSON.parse(competitor.aliases || '[]'),
      watched_concepts: JSON.parse(competitor.watched_concepts || '[]')
    });
  } catch (err) { next(err); }
});

export default router;
