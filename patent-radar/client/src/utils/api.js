const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/csv') || contentType.includes('application/json') && options._download) {
    if (!res.ok) throw new Error(`Export error: ${res.status}`);
    return res.blob();
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data;
}

export function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiGet(path) {
  return request(path);
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

export async function downloadExport(format, patents) {
  const res = await fetch(`${API_BASE}/export/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patents }),
  });

  if (!res.ok) throw new Error(`Export error: ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patent-radar-export.${format === 'csv' ? 'csv' : 'json'}`;
  a.click();
  URL.revokeObjectURL(url);
}
