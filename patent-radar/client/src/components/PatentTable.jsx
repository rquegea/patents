import { useState, useMemo } from 'react';
import { formatDate, truncate, statusColor, pubTypeLabel } from '../utils/formatters';

export default function PatentTable({ patents = [], total = 0, onSelect, onLoadMore, loadingMore }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    if (!sortField) return patents;
    return [...patents].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [patents, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const hasMore = patents.length < total;

  if (patents.length === 0) {
    return <div className="py-12 text-center text-sm text-text-secondary">No patents to display.</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs">
              {[
                ['title', 'Title'],
                ['applicants', 'Applicant'],
                ['jurisdiction', 'Jur.'],
                ['datePublished', 'Date'],
                [null, 'Status'],
              ].map(([field, label]) => (
                <th
                  key={label}
                  className={`text-left py-2 px-2 font-normal ${field ? 'cursor-pointer hover:text-text-primary' : ''}`}
                  onClick={field ? () => handleSort(field) : undefined}
                >
                  {label}
                  {field && sortField === field && (
                    <span className="ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((patent, i) => (
              <tr
                key={patent.lensId || i}
                onClick={() => onSelect?.(patent)}
                className="border-b border-border/60 hover:bg-bg-hover cursor-pointer transition-colors"
              >
                <td className="py-2 px-2 max-w-[260px]">
                  <div className="text-text-primary truncate">{truncate(patent.title, 55)}</div>
                </td>
                <td className="py-2 px-2 text-text-secondary text-xs max-w-[160px] truncate">
                  {patent.applicants?.[0] || '\u2014'}
                </td>
                <td className="py-2 px-2 text-xs text-text-secondary">
                  {patent.jurisdiction}
                </td>
                <td className="py-2 px-2 text-xs text-text-secondary whitespace-nowrap">
                  {formatDate(patent.datePublished)}
                </td>
                <td className="py-2 px-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(patent.legalStatus) }} />
                    <span className="text-text-secondary">{pubTypeLabel(patent.publicationType)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-3 pt-3 border-t border-border text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors disabled:opacity-50"
          >
            {loadingMore
              ? 'Loading...'
              : `Load more (${patents.length} of ${total.toLocaleString()})`
            }
          </button>
        </div>
      )}

      {!hasMore && patents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-text-secondary">
            Showing all {patents.length} of {total.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
