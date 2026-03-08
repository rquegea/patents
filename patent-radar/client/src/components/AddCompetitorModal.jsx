import { useState, useEffect } from 'react';

const TYPE_OPTIONS = [
  { value: 'competitor', label: 'Competitor' },
  { value: 'partner', label: 'Partner' },
  { value: 'research', label: 'Research' },
  { value: 'own', label: 'Own Company' },
];

export default function AddCompetitorModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    aliases: '',
    competitor_type: 'competitor',
    watched_concepts: '',
    notes: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        aliases: (initial.aliases || []).join('\n'),
        competitor_type: initial.competitor_type || 'competitor',
        watched_concepts: (initial.watched_concepts || []).join('\n'),
        notes: initial.notes || '',
      });
    }
  }, [initial]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      aliases: form.aliases.split('\n').map(s => s.trim()).filter(Boolean),
      competitor_type: form.competitor_type,
      watched_concepts: form.watched_concepts.split('\n').map(s => s.trim()).filter(Boolean),
      notes: form.notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-bg-primary border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold text-text-primary mb-5">
          {initial ? 'Edit Company' : 'Add Company'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Company Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. BASF"
              autoFocus
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc] focus:ring-1 focus:ring-[#2eaadc]/20"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Name Variations <span className="text-text-secondary">(one per line)</span></label>
            <textarea
              value={form.aliases}
              onChange={e => setForm(p => ({ ...p, aliases: e.target.value }))}
              placeholder="BASF SE&#10;BASF CORP&#10;BASF AG"
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Type</label>
            <div className="flex gap-3 flex-wrap">
              {TYPE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={form.competitor_type === opt.value}
                    onChange={() => setForm(p => ({ ...p, competitor_type: opt.value }))}
                    className="text-[#2eaadc]"
                  />
                  <span className="text-sm text-text-primary">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">
              Concepts to watch <span className="text-text-secondary">(one per line — leave empty to monitor ALL patents)</span>
            </label>
            <textarea
              value={form.watched_concepts}
              onChange={e => setForm(p => ({ ...p, watched_concepts: e.target.value }))}
              placeholder="solid state battery&#10;electrolyte membrane"
              rows={3}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-text-primary text-white text-sm font-medium rounded-md hover:bg-[#2f2f2f] transition-colors"
            >
              {initial ? 'Save Changes' : 'Add Company'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
