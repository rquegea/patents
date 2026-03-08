import { useState, useEffect } from 'react';
import { formatDate, truncate, pubTypeLabel } from '../utils/formatters';
import AddCompetitorModal from './AddCompetitorModal';

const TYPE_COLORS = {
  competitor: '#ef4444',
  partner: '#2eaadc',
  research: '#8b5cf6',
  own: '#10b981',
};

const TYPE_BG = {
  competitor: '#fde8e8',
  partner: '#d3e5ef',
  research: '#ede9fe',
  own: '#d1fae5',
};

const TYPE_LABELS = {
  competitor: 'Competitor',
  partner: 'Partner',
  research: 'Research',
  own: 'Own Company',
};

function timeAgo(dateStr) {
  if (!dateStr) return 'Not checked yet';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CompetitorDetail({
  competitor, patents, loading,
  onCheck, onMarkSeen, onEdit, onDelete, onFetchPatents, addToast, checking
}) {
  const [tab, setTab] = useState('new');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    onFetchPatents(competitor.id, tab === 'new');
  }, [competitor.id, tab]);

  const handleCheck = async () => {
    try {
      const result = await onCheck(competitor.id);
      onFetchPatents(competitor.id, tab === 'new');
      if (result.new_count > 0) {
        addToast(`${result.new_count} new patent${result.new_count !== 1 ? 's' : ''} found`, 'success');
      } else {
        addToast('No new patents found', 'info');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleMarkSeen = async () => {
    await onMarkSeen(competitor.id);
    onFetchPatents(competitor.id, tab === 'new');
  };

  const handleDelete = () => {
    if (confirm(`Delete ${competitor.name}? This will remove all tracked patents.`)) {
      onDelete(competitor.id);
    }
  };

  const handleEdit = async (formData) => {
    await onEdit(competitor.id, formData);
    setShowEdit(false);
  };

  const color = TYPE_COLORS[competitor.competitor_type] || '#9b9a97';
  const bg = TYPE_BG[competitor.competitor_type] || '#f3f3f3';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <h2 className="text-base font-semibold text-text-primary truncate">{competitor.name}</h2>
            <span
              className="text-xs px-2 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: bg, color }}
            >
              {TYPE_LABELS[competitor.competitor_type] || competitor.competitor_type}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary mb-3">
          {timeAgo(competitor.last_checked)} · {competitor.total_patents} total
          {competitor.new_patents > 0 && (
            <span className="ml-1.5 text-[#ef4444] font-medium">{competitor.new_patents} new</span>
          )}
        </p>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="px-3 py-1.5 text-xs bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-50 transition-colors"
          >
            {checking ? 'Checking...' : 'Check Now'}
          </button>
          {competitor.new_patents > 0 && (
            <button
              onClick={handleMarkSeen}
              className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
            >
              Mark All Seen
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs text-[#e03e3e] hover:bg-[#fbe4e4] rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-border px-5">
        <button
          onClick={() => setTab('new')}
          className={`px-2 py-2 text-sm relative transition-colors ${tab === 'new' ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
        >
          New {competitor.new_patents > 0 && `(${competitor.new_patents})`}
          {tab === 'new' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-2 py-2 text-sm relative transition-colors ${tab === 'all' ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
        >
          All {competitor.total_patents > 0 && `(${competitor.total_patents})`}
          {tab === 'all' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />}
        </button>
      </div>

      {/* Patent list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-12 text-center text-sm text-text-secondary">Loading...</div>
        ) : patents.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">
            {tab === 'new' ? 'No new patents. Click Check Now to refresh.' : 'No patents tracked yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary text-xs">
                <th className="text-left py-2 px-3 font-normal">Title</th>
                <th className="text-left py-2 px-2 font-normal">Jur.</th>
                <th className="text-left py-2 px-2 font-normal">Date</th>
                <th className="text-left py-2 px-2 font-normal">Type</th>
                <th className="py-2 px-2" />
              </tr>
            </thead>
            <tbody>
              {patents.map(p => (
                <tr
                  key={p.id}
                  onClick={() => p.lens_url && window.open(p.lens_url, '_blank')}
                  className="border-b border-border/60 hover:bg-bg-hover cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 max-w-[260px]">
                    <div className="flex items-center gap-1.5">
                      {p.is_new === 1 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] flex-shrink-0" />
                      )}
                      <span className="text-text-primary truncate">{truncate(p.title, 50)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-xs text-text-secondary">{p.jurisdiction}</td>
                  <td className="py-2 px-2 text-xs text-text-secondary whitespace-nowrap">{formatDate(p.date_published)}</td>
                  <td className="py-2 px-2 text-xs text-text-secondary">{pubTypeLabel(p.publication_type)}</td>
                  <td className="py-2 px-2 text-xs text-[#2eaadc]">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && (
        <AddCompetitorModal
          initial={competitor}
          onSave={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
