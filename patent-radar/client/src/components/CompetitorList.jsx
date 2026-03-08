import { useState } from 'react';
import AddCompetitorModal from './AddCompetitorModal';

const TYPE_COLORS = {
  competitor: '#ef4444',
  partner: '#2eaadc',
  research: '#8b5cf6',
  own: '#10b981',
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CompetitorList({
  competitors, selectedId, onSelect, onCreate, onCheckAll, checking, addToast
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(null);

  const handleCheckAll = async () => {
    setCheckingProgress(0);
    try {
      const result = await onCheckAll();
      const totalNew = result.results.reduce((sum, r) => sum + (r.new_count || 0), 0);
      addToast(
        totalNew > 0 ? `${totalNew} new patents found across ${result.checked} companies` : 'No new patents found',
        totalNew > 0 ? 'success' : 'info'
      );
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCheckingProgress(null);
    }
  };

  const handleCreate = async (formData) => {
    await onCreate(formData);
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm text-text-primary font-medium hover:text-[#2eaadc] transition-colors"
        >
          + Add Company
        </button>
        <button
          onClick={handleCheckAll}
          disabled={checking || competitors.length === 0}
          className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
        >
          {checkingProgress !== null ? `Checking...` : 'Check All'}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {competitors.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm text-text-secondary leading-relaxed">
              No companies added yet.<br />
              Click <strong className="text-text-primary font-medium">+ Add Company</strong> to start monitoring.
            </p>
          </div>
        ) : (
          competitors.map(c => {
            const color = TYPE_COLORS[c.competitor_type] || '#9b9a97';
            const isActive = selectedId === c.id;
            const ago = timeAgo(c.last_checked);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/60 transition-colors ${isActive ? 'bg-bg-panel' : 'hover:bg-bg-hover'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-text-primary truncate">{c.name}</span>
                  </div>
                  {c.new_patents > 0 && (
                    <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#fde8e8] text-[#ef4444]">
                      {c.new_patents} NEW
                    </span>
                  )}
                </div>
                <div className="mt-0.5 ml-4 text-xs text-text-secondary">
                  {c.total_patents} patent{c.total_patents !== 1 ? 's' : ''} · {ago ? `Checked ${ago}` : 'Not checked yet'}
                </div>
              </button>
            );
          })
        )}
      </div>

      {showAdd && (
        <AddCompetitorModal onSave={handleCreate} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
