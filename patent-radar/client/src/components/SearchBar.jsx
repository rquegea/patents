import { useState, useEffect } from 'react';
import { JURISDICTION_OPTIONS } from '../utils/countryCoords';

const PUBLICATION_TYPES = [
  { value: '', label: 'All types' },
  { value: 'PATENT_APPLICATION', label: 'Applications' },
  { value: 'GRANTED_PATENT', label: 'Granted' },
];

export default function SearchBar({ onSearch, loading, history, onFetchHistory }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState({
    yearFrom: 2020,
    yearTo: 2026,
    countries: [],
    publicationType: '',
    groupByFamily: false,
  });

  useEffect(() => {
    onFetchHistory?.();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), filters);
    setShowHistory(false);
  };

  const toggleCountry = (code) => {
    setFilters(prev => ({
      ...prev,
      countries: prev.countries.includes(code)
        ? prev.countries.filter(c => c !== code)
        : [...prev.countries, code]
    }));
  };

  const handleHistoryClick = (item) => {
    setQuery(item.query);
    if (item.filters) setFilters(prev => ({ ...prev, ...item.filters }));
    setShowHistory(false);
    onSearch(item.query, item.filters || {});
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              placeholder="Search patents..."
              className="w-full border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary bg-bg-primary focus:outline-none focus:border-[#2eaadc] focus:ring-1 focus:ring-[#2eaadc]/20 transition-all"
            />
            {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_3px_6px_rgba(15,15,15,0.1),0_9px_24px_rgba(15,15,15,0.2)] z-50 max-h-48 overflow-y-auto">
                {history.slice(0, 8).map((item, i) => (
                  <button
                    key={item.id || i}
                    type="button"
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left px-3 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors"
                  >
                    {item.query}
                    <span className="ml-2 text-xs text-text-secondary">{item.resultCount}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-md border text-sm transition-colors ${
              showFilters
                ? 'bg-bg-panel border-border text-text-primary'
                : 'border-border text-text-secondary hover:bg-bg-panel'
            }`}
          >
            Filters{filters.countries.length > 0 && ` (${filters.countries.length})`}
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-text-primary text-white text-sm font-medium rounded-md hover:bg-[#2f2f2f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Year range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={e => setFilters(prev => ({ ...prev, yearFrom: parseInt(e.target.value) }))}
                    className="w-24 border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc]"
                    min={1970} max={2026}
                  />
                  <span className="text-text-secondary text-sm">to</span>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={e => setFilters(prev => ({ ...prev, yearTo: parseInt(e.target.value) }))}
                    className="w-24 border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc]"
                    min={1970} max={2026}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Publication type</label>
                <select
                  value={filters.publicationType}
                  onChange={e => setFilters(prev => ({ ...prev, publicationType: e.target.value }))}
                  className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm text-text-primary bg-bg-primary focus:outline-none focus:border-[#2eaadc]"
                >
                  {PUBLICATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Jurisdictions</label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {JURISDICTION_OPTIONS.map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleCountry(code)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        filters.countries.includes(code)
                          ? 'bg-[#d3e5ef] text-[#2eaadc]'
                          : 'bg-bg-panel text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.groupByFamily}
                onChange={e => setFilters(prev => ({ ...prev, groupByFamily: e.target.checked }))}
                className="rounded border-border text-[#2eaadc] focus:ring-[#2eaadc]/20"
              />
              <span className="text-sm text-text-primary">Group by patent family</span>
              <span className="text-xs text-text-secondary">(SIMPLE_FAMILY)</span>
            </label>
          </div>
        )}
      </form>

      {showHistory && (
        <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
      )}
    </div>
  );
}
