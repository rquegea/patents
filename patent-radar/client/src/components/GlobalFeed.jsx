import { useEffect } from 'react';
import { formatDate, truncate, pubTypeLabel } from '../utils/formatters';

const TYPE_COLORS = {
  competitor: '#ef4444',
  partner: '#2eaadc',
  research: '#8b5cf6',
  own: '#10b981',
};

export default function GlobalFeed({ feed, onFetch }) {
  useEffect(() => {
    onFetch();
  }, []);

  if (!feed || feed.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <p className="text-sm text-text-secondary leading-relaxed">
          No new patents yet.<br />
          Select a company and click <strong className="text-text-primary font-medium">Check Now</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {feed.map(item => (
          <div
            key={item.id}
            className="border border-border rounded-lg p-3 hover:bg-bg-hover transition-colors cursor-pointer"
            onClick={() => item.lens_url && window.open(item.lens_url, '_blank')}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[item.competitor_type] || '#9b9a97' }}
                />
                <span className="text-xs font-medium text-text-secondary truncate">{item.competitor_name}</span>
              </div>
              <span className="text-xs text-text-secondary whitespace-nowrap flex-shrink-0">
                {formatDate(item.date_published)}
              </span>
            </div>
            <p className="text-sm text-text-primary leading-snug mb-1">
              {truncate(item.title, 90)}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {item.jurisdiction} · {pubTypeLabel(item.publication_type)}
              </span>
              <span className="text-xs text-[#2eaadc]">→ Lens</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
