export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function truncate(str, max = 100) {
  if (!str || str.length <= max) return str || '';
  return str.substring(0, max) + '...';
}

export function statusColor(status) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return '#0f7b6c';
    case 'GRANTED': return '#0f7b6c';
    case 'PENDING': return '#cb912f';
    case 'EXPIRED': return '#e03e3e';
    case 'REVOKED': return '#e03e3e';
    default: return '#9b9a97';
  }
}

export function pubTypeLabel(type) {
  switch (type) {
    case 'GRANTED_PATENT': return 'Granted';
    case 'PATENT_APPLICATION': return 'Application';
    case 'DESIGN_PATENT': return 'Design';
    default: return type || '—';
  }
}

export function pubTypeColor(type) {
  switch (type) {
    case 'GRANTED_PATENT': return '#0f7b6c';
    case 'PATENT_APPLICATION': return '#2eaadc';
    default: return '#cb912f';
  }
}
