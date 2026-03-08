import { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatters';

export default function AlertManager({ alerts, onFetch, onCreate, onDelete, onCheck, currentQuery }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(null);

  useEffect(() => { onFetch?.(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !currentQuery) return;
    await onCreate(name.trim(), currentQuery);
    setName('');
    setShowForm(false);
  };

  const handleCheck = async (id) => {
    setChecking(id);
    const result = await onCheck(id);
    setCheckResult({ id, ...result });
    setChecking(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Alerts</span>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!currentQuery}
          className="text-xs text-[#2eaadc] hover:underline disabled:opacity-30 disabled:no-underline"
        >
          + New alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-bg-panel rounded-md p-3 space-y-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Alert name..."
            className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary bg-white focus:outline-none focus:border-[#2eaadc]"
          />
          <div className="text-xs text-text-secondary">
            Query: <span className="text-text-primary">{currentQuery}</span>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1 text-xs bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] transition-colors">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {alerts.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-secondary">
          No alerts yet. Search first, then create an alert.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="border border-border rounded-md p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-text-primary font-medium">{alert.name}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{alert.query}</div>
                  <div className="flex gap-3 mt-1.5 text-xs text-text-secondary">
                    <span>{alert.lastCheckedAt ? formatDate(alert.lastCheckedAt) : 'Never checked'}</span>
                    {alert.totalFound > 0 && (
                      <span className="text-[#0f7b6c]">{alert.totalFound} tracked</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCheck(alert.id)}
                    disabled={checking === alert.id}
                    className="px-2 py-1 text-xs text-[#2eaadc] hover:bg-[#d3e5ef] rounded transition-colors disabled:opacity-50"
                  >
                    {checking === alert.id ? 'Checking...' : 'Check'}
                  </button>
                  <button
                    onClick={() => onDelete(alert.id)}
                    className="px-2 py-1 text-xs text-text-secondary hover:text-[#e03e3e] hover:bg-[#fbe4e4] rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {checkResult?.id === alert.id && (
                <div className="mt-2 pt-2 border-t border-border text-xs text-text-secondary">
                  {checkResult.newPatents > 0 ? (
                    <span className="text-[#0f7b6c]">{checkResult.newPatents} new patents found</span>
                  ) : (
                    <span>No new patents</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
