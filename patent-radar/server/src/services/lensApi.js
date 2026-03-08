import { getMockResults } from './mockData.js';

const LENS_API_URL = 'https://api.lens.org/patent/search';

async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('x-rate-limit-retry-after-seconds') ||
                          response.headers.get('retry-after') || 10;
      const delay = Math.min(parseInt(retryAfter) * 1000, 30000);
      console.log(`Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded for Lens API');
}

function buildQuery(concept, options = {}) {
  const {
    yearFrom = 2020,
    yearTo = 2026,
    countries = [],
    publicationType,
    groupByFamily = false,
    size = 50,
    from = 0,
    sortBy = "date_published",
    sortOrder = "desc"
  } = options;

  const must = [
    {
      query_string: {
        query: concept,
        fields: ["title", "abstract", "claims", "description"],
        default_operator: "and"
      }
    },
    {
      range: {
        date_published: {
          gte: `${yearFrom}-01-01`,
          lte: `${yearTo}-12-31`
        }
      }
    }
  ];

  if (countries.length > 0) {
    must.push({ terms: { jurisdiction: countries } });
  }

  if (publicationType) {
    must.push({ term: { publication_type: publicationType } });
  }

  const body = {
    query: { bool: { must } },
    size,
    from,
    sort: [{ [sortBy]: sortOrder }],
    include: [
      "lens_id",
      "jurisdiction",
      "date_published",
      "doc_number",
      "kind",
      "biblio.invention_title",
      "biblio.parties.applicants",
      "biblio.parties.inventors",
      "biblio.classifications_ipcr",
      "abstract",
      "publication_type",
      "legal_status",
      "families"
    ]
  };

  if (groupByFamily) {
    body.group_by = "SIMPLE_FAMILY";
  }

  return body;
}

export async function searchPatents(concept, options = {}) {
  const token = process.env.LENS_API_TOKEN;

  if (!token) {
    console.log('No LENS_API_TOKEN — using mock data');
    return {
      ...getMockResults(concept, options),
      mock: true,
      groupByFamily: options.groupByFamily || false
    };
  }

  const body = buildQuery(concept, options);

  const response = await fetchWithRetry(LENS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lens API error: ${response.status} ${errorText}`);
  }

  const rateLimitInfo = {
    remainingRequestsPerMinute: response.headers.get('x-rate-limit-remaining-request-per-minute'),
    remainingRecordsPerMonth: response.headers.get('x-rate-limit-remaining-record-per-month'),
  };

  const data = await response.json();
  return {
    ...data,
    rateLimitInfo,
    mock: false,
    groupByFamily: options.groupByFamily || false
  };
}

export async function rawSearch(body) {
  const token = process.env.LENS_API_TOKEN;
  if (!token) throw new Error('LENS_API_TOKEN not configured');

  const response = await fetchWithRetry(LENS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lens API error: ${response.status} ${errorText}`);
  }

  const rateLimitInfo = {
    remainingRequestsPerMinute: response.headers.get('x-rate-limit-remaining-request-per-minute'),
    remainingRecordsPerMonth: response.headers.get('x-rate-limit-remaining-record-per-month'),
  };

  const data = await response.json();
  return { ...data, rateLimitInfo };
}
