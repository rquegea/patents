import { Router } from 'express';
import { searchPatents } from '../services/lensApi.js';
import { processPatentResults } from '../services/patentProcessor.js';
import { getCachedSearch, setCachedSearch, getSearchHistory } from '../services/cache.js';

const router = Router();

router.post('/search', async (req, res, next) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const filtersJson = JSON.stringify(filters);

    // Check cache (skip for paginated requests beyond first page)
    if (!filters.from || filters.from === 0) {
      const cached = getCachedSearch(query, filtersJson);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }
    }

    // Call Lens API (or mock)
    const rawResults = await searchPatents(query, filters);
    const processed = processPatentResults(rawResults);

    const responseData = {
      ...processed,
      mock: rawResults.mock || false,
      rateLimitInfo: rawResults.rateLimitInfo || null,
      groupByFamily: rawResults.groupByFamily || false
    };

    // Cache only first page
    if (!filters.from || filters.from === 0) {
      setCachedSearch(query, filtersJson, responseData, processed.total);
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
});

router.get('/search/history', (req, res, next) => {
  try {
    const history = getSearchHistory(20);
    res.json(history.map(h => ({
      id: h.id,
      query: h.query_text,
      filters: h.filters_json ? JSON.parse(h.filters_json) : {},
      resultCount: h.result_count,
      createdAt: h.created_at
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
