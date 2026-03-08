import { Router } from 'express';
import { getDb } from '../db/schema.js';
import { rawSearch } from '../services/lensApi.js';
import { extractTitle, extractAbstract } from '../services/patentProcessor.js';

const router = Router({ mergeParams: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcTechProximity(clientKeywords, discoveredTitle, discoveredAbstract) {
  if (!clientKeywords.length) return 0;
  const text = `${discoveredTitle} ${discoveredAbstract}`.toLowerCase();
  const matches = clientKeywords.filter(kw => text.includes(kw.toLowerCase()));
  return Math.round((matches.length / clientKeywords.length) * 100);
}

function calcThreatLevel(threatScore) {
  if (threatScore >= 70) return 'high';
  if (threatScore >= 40) return 'medium';
  if (threatScore >= 15) return 'low';
  return 'none';
}

async function analyzeWithClaude(clientPatent, discoveredPatent) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { overlap_score: 0, infringement_risk: 'none', explanation: 'No Anthropic API key configured.' };

  const userMessage = [
    `PATENTE A (propia):`,
    `Título: ${clientPatent.title || 'N/A'}`,
    `Claims: ${clientPatent.claims_summary || clientPatent.key_claims?.join('; ') || 'N/A'}`,
    ``,
    `PATENTE B (competidora):`,
    `Título: ${discoveredPatent.title}`,
    `Abstract: ${discoveredPatent.abstract}`,
  ].join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: 'Eres un analista de patentes. Compara estas dos patentes y evalúa: 1) grado de solapamiento en reivindicaciones (0-100), 2) si la patente B podría infringir la patente A, 3) explicación breve del riesgo. Responde SOLO en JSON: { "overlap_score": number, "infringement_risk": "high"|"medium"|"low"|"none", "explanation": string }',
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '{}';
  const text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    console.error('[Impact] Failed to parse Claude response:', rawText);
    return { overlap_score: 0, infringement_risk: 'none', explanation: 'Error parsing AI response.' };
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/clients/:id/impact/analyze
router.post('/:id/impact/analyze', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { clientPatentId, discoveredPatentIds } = req.body;

    // Validate client
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Validate client patent
    if (!clientPatentId) return res.status(400).json({ error: 'clientPatentId es requerido' });
    const clientPatent = db.prepare('SELECT * FROM client_patents WHERE id = ? AND client_id = ?').get(clientPatentId, id);
    if (!clientPatent) return res.status(404).json({ error: 'Patente propia no encontrada' });

    const clientKeywords = JSON.parse(clientPatent.technology_keywords || '[]');
    const clientKeyClaims = JSON.parse(clientPatent.key_claims || '[]');

    // Resolve lens_ids to analyze
    let lensIds = [];
    if (Array.isArray(discoveredPatentIds) && discoveredPatentIds.length > 0) {
      lensIds = discoveredPatentIds.slice(0, 50);
    } else {
      // Load from latest completed scan
      const latestScan = db.prepare(
        "SELECT id FROM radar_scans WHERE client_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1"
      ).get(id);

      if (!latestScan) {
        return res.status(400).json({ error: 'No hay escaneos completados. Ejecuta el Radar primero.' });
      }

      const competitors = db.prepare(
        'SELECT patent_ids FROM discovered_competitors WHERE scan_id = ?'
      ).all(latestScan.id);

      const allIds = [];
      for (const c of competitors) {
        const ids = JSON.parse(c.patent_ids || '[]');
        allIds.push(...ids);
      }
      lensIds = [...new Set(allIds)].slice(0, 50);
    }

    if (lensIds.length === 0) {
      return res.status(400).json({ error: 'No hay patentes descubiertas para analizar. Ejecuta el Radar primero.' });
    }

    // Find which pairs are already cached
    const cached = db.prepare(
      'SELECT discovered_patent_lens_id FROM impact_analyses WHERE client_patent_id = ?'
    ).all(clientPatentId).map(r => r.discovered_patent_lens_id);
    const cachedSet = new Set(cached);
    const newIds = lensIds.filter(id => !cachedSet.has(id));

    console.log(`[Impact] client_patent=${clientPatentId}: ${lensIds.length} total, ${cached.length} cached, ${newIds.length} to analyze`);

    // Fetch new patent data from Lens
    if (newIds.length > 0) {
      if (!process.env.LENS_API_TOKEN) {
        return res.status(400).json({ error: 'Se requiere LENS_API_TOKEN para el análisis de impacto.' });
      }

      console.log(`[Impact] Fetching ${newIds.length} patents from Lens...`);
      const lensData = await rawSearch({
        query: { terms: { lens_id: newIds } },
        size: 50,
        include: [
          'lens_id', 'biblio.invention_title', 'abstract',
          'biblio.parties.applicants', 'biblio.classifications_ipcr',
        ],
      });

      const discoveredPatents = (lensData.data || lensData.results || []).map(p => ({
        lens_id: p.lens_id,
        title: extractTitle(p.biblio?.invention_title),
        abstract: extractAbstract(p.abstract),
        applicant: p.biblio?.parties?.applicants?.[0]?.extracted_name?.value ||
                   p.biblio?.parties?.applicants?.[0]?.applicant_name?.name || '',
      }));

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO impact_analyses
          (client_patent_id, discovered_patent_lens_id, discovered_patent_title,
           discovered_patent_applicant, overlap_score, tech_proximity_score,
           threat_level, threat_score, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const dp of discoveredPatents) {
        console.log(`[Impact] Analyzing pair: clientPatent=${clientPatentId} vs lens_id=${dp.lens_id}`);

        const techProximity = calcTechProximity(clientKeywords, dp.title, dp.abstract);

        const claudeResult = await analyzeWithClaude(
          { ...clientPatent, key_claims: clientKeyClaims },
          dp
        );

        const overlapScore = Math.min(100, Math.max(0, claudeResult.overlap_score || 0));
        const threatScore = overlapScore * 0.6 + techProximity * 0.4;
        const threatLevel = calcThreatLevel(threatScore);

        console.log(`[Impact] Saved: overlap=${overlapScore} proximity=${techProximity} threat=${threatLevel}(${threatScore.toFixed(1)})`);

        insertStmt.run(
          clientPatentId, dp.lens_id, dp.title, dp.applicant,
          overlapScore, techProximity, threatLevel,
          parseFloat(threatScore.toFixed(2)),
          claudeResult.explanation || ''
        );

        // Avoid hitting Anthropic rate limits on large batches
        await new Promise(r => setTimeout(r, 400));
      }
    }

    // Load all analyses for this client patent
    const analyses = db.prepare(`
      SELECT * FROM impact_analyses
      WHERE client_patent_id = ?
      ORDER BY threat_score DESC
    `).all(clientPatentId);

    res.json({
      client_patent_id: clientPatentId,
      total: analyses.length,
      new_analyzed: newIds.length,
      analyses,
    });

  } catch (err) {
    console.error('[Impact] ERROR:', err.message);
    next(err);
  }
});

// GET /api/clients/:id/impact/analyses/:clientPatentId
router.get('/:id/impact/analyses/:clientPatentId', (req, res, next) => {
  try {
    const db = getDb();
    const { id, clientPatentId } = req.params;

    const clientPatent = db.prepare('SELECT id FROM client_patents WHERE id = ? AND client_id = ?').get(clientPatentId, id);
    if (!clientPatent) return res.status(404).json({ error: 'Patente no encontrada' });

    const analyses = db.prepare(`
      SELECT * FROM impact_analyses
      WHERE client_patent_id = ?
      ORDER BY threat_score DESC
    `).all(clientPatentId);

    res.json({ client_patent_id: clientPatentId, total: analyses.length, analyses });
  } catch (err) { next(err); }
});

export default router;
