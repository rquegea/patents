import { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import PatentMap from './components/PatentMap';
import PatentTable from './components/PatentTable';
import PatentDetail from './components/PatentDetail';
import TrendCharts from './components/TrendCharts';
import AlertManager from './components/AlertManager';
import ExportPanel from './components/ExportPanel';
import CompetitorsView from './components/CompetitorsView';
import ClientVault from './components/ClientVault';
import RadarView from './components/RadarView';
import { usePatentSearch } from './hooks/usePatentSearch';
import { useAlerts } from './hooks/useAlerts';
import { useClientVault } from './hooks/useClientVault';

const TABS = [
  { id: 'table', label: 'Results' },
  { id: 'charts', label: 'Trends' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'export', label: 'Export' },
];

const VIEWS = [
  { id: 'client', label: 'Mi Empresa' },
  { id: 'radar', label: 'Radar' },
  { id: 'competitors', label: 'Competidores' },
  { id: 'search', label: 'Búsqueda' },
];

export default function App() {
  const { results, loading, loadingMore, error, history, search, loadMore, fetchHistory } = usePatentSearch();
  const { alerts, fetchAlerts, createAlert, deleteAlert, checkAlert } = useAlerts();
  const clientVault = useClientVault();
  const {
    clients, selectedClient, setSelectedClient, patents,
    fetchClients, createClient, updateClient, deleteClient,
    fetchPatents, addPatent, lookupPatent, searchByApplicant, deletePatent, extractKeywords,
  } = clientVault;

  const [activeTab, setActiveTab] = useState('table');
  const [selectedPatent, setSelectedPatent] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(true);
  const [activeView, setActiveView] = useState('client');
  const [toasts, setToasts] = useState([]);
  const [totalNewCompetitorPatents, setTotalNewCompetitorPatents] = useState(0);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => { setDemoMode(!d.hasToken); setHasAnthropicKey(!!d.hasAnthropicKey); })
      .catch(() => {});

    fetch('/api/competitors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTotalNewCompetitorPatents(data.reduce((sum, c) => sum + (c.new_patents || 0), 0));
        }
      })
      .catch(() => {});

    fetchClients().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setActiveView('radar');
      }
    });
  }, [fetchClients]);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const handleSearch = useCallback((query, filters) => {
    setCurrentQuery(query);
    search(query, filters);
    setActiveTab('table');
  }, [search]);

  const handleCreateAlertFromPatent = useCallback(() => {
    setActiveTab('alerts');
  }, []);

  const aggregatedKeywords = [...new Set(
    patents.flatMap(p => Array.isArray(p.technology_keywords) ? p.technology_keywords : [])
  )];

  const TOAST_COLORS = {
    success: { bg: '#d1fae5', text: '#065f46' },
    error: { bg: '#fbe4e4', text: '#e03e3e' },
    info: { bg: '#f7f6f3', text: '#37352f' },
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base text-text-primary" style={{ fontFamily: "'Switzer', sans-serif", fontWeight: 600, letterSpacing: '-0.04em' }}>2laps</h1>
            {selectedClient && (
              <span className="text-sm text-text-secondary">· {selectedClient.name}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {results?.rateLimitInfo && (
              <span className="text-xs text-text-secondary">
                {results.rateLimitInfo.remainingRequestsPerMinute} req/min
              </span>
            )}
            {!hasAnthropicKey && (
              <span className="px-2 py-0.5 rounded bg-[#fef3c7] text-[#cb912f] text-xs">
                Sin IA
              </span>
            )}
            {demoMode && (
              <span className="px-2 py-0.5 rounded bg-[#fbecdd] text-[#cb912f] text-xs">
                Demo mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Top nav */}
      <nav className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 flex gap-0">
          {VIEWS.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-3 py-2 text-sm relative transition-colors ${
                activeView === view.id
                  ? 'text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {view.label}
              {view.id === 'competitors' && totalNewCompetitorPatents > 0 && (
                <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#fde8e8] text-[#ef4444]">
                  {totalNewCompetitorPatents}
                </span>
              )}
              {activeView === view.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      {activeView === 'client' && (
        <div className="max-w-[600px] mx-auto px-6 py-5">
          <ClientVault
            clients={clients}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            patents={patents}
            loading={clientVault.loading}
            error={clientVault.error}
            fetchClients={fetchClients}
            createClient={createClient}
            updateClient={updateClient}
            deleteClient={deleteClient}
            fetchPatents={fetchPatents}
            addPatent={addPatent}
            lookupPatent={lookupPatent}
            searchByApplicant={searchByApplicant}
            deletePatent={deletePatent}
            extractKeywords={extractKeywords}
          />
        </div>
      )}

      {activeView === 'radar' && (
        <div className="max-w-[700px] mx-auto px-6 py-5">
          <RadarView
            clientId={selectedClient?.id}
            clientName={selectedClient?.name}
            technologyKeywords={aggregatedKeywords}
          />
        </div>
      )}

      {activeView === 'competitors' && (
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <CompetitorsView addToast={addToast} />
        </div>
      )}

      {activeView === 'search' && (
        <>
          {/* Search */}
          <div className="max-w-[1400px] mx-auto px-6 pt-5 pb-3">
            <SearchBar
              onSearch={handleSearch}
              loading={loading}
              history={history}
              onFetchHistory={fetchHistory}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-[1400px] mx-auto px-6 pb-3">
              <div className="bg-[#fbe4e4] text-[#e03e3e] rounded px-3 py-2 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-w-[1400px] mx-auto px-6 pb-8">
            {results ? (
              <>
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-2xl font-semibold text-text-primary" style={{ fontFamily: "'Switzer', sans-serif", letterSpacing: '-0.03em' }}>
                    {results.total.toLocaleString()}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {results.groupByFamily ? 'patent families' : 'patent documents'}
                  </span>
                  {results.cached && (
                    <span className="text-xs text-text-secondary">(cached)</span>
                  )}
                  {results.mock && (
                    <span className="text-xs text-[#cb912f]">(mock data)</span>
                  )}
                  {results.groupByFamily && (
                    <span className="px-2 py-0.5 rounded bg-[#d3e5ef] text-[#2eaadc] text-xs">
                      grouped by family
                    </span>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: 'calc(100vh - 260px)' }}>
                  {/* Map */}
                  <div className="lg:w-[58%] min-h-[400px] lg:min-h-0">
                    <div className="h-[480px] lg:h-[calc(100vh-300px)]">
                      <PatentMap patents={results.patents} />
                    </div>
                  </div>

                  {/* Right Panel */}
                  <div className="lg:w-[42%] flex flex-col">
                    <div className="flex gap-0 mb-4 border-b border-border">
                      {TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-3 py-2 text-sm transition-colors relative ${
                            activeTab === tab.id
                              ? 'text-text-primary font-medium'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {tab.label}
                          {tab.id === 'table' && results?.patents?.length > 0 && (
                            <span className="ml-1 text-text-secondary text-xs">{results.patents.length}</span>
                          )}
                          {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {activeTab === 'table' && (
                        <PatentTable
                          patents={results.patents}
                          total={results.total}
                          onSelect={setSelectedPatent}
                          onLoadMore={loadMore}
                          loadingMore={loadingMore}
                        />
                      )}
                      {activeTab === 'charts' && (
                        <TrendCharts analytics={results.analytics} />
                      )}
                      {activeTab === 'alerts' && (
                        <AlertManager
                          alerts={alerts}
                          onFetch={fetchAlerts}
                          onCreate={createAlert}
                          onDelete={deleteAlert}
                          onCheck={checkAlert}
                          currentQuery={currentQuery}
                        />
                      )}
                      {activeTab === 'export' && (
                        <ExportPanel patents={results.patents} />
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <div className="text-center max-w-sm">
                  <h2 className="text-2xl text-text-primary mb-1.5" style={{ fontFamily: "'Switzer', sans-serif", fontWeight: 600, letterSpacing: '-0.04em' }}>2laps</h2>
                  <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                    Search patents worldwide. Enter a technical concept to explore trends and track innovation.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['sepiolite purification', 'CRISPR gene editing', 'solid state battery', 'graphene composite'].map(term => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term, {})}
                        className="px-3 py-1.5 text-sm text-text-secondary bg-bg-panel rounded hover:bg-bg-hover transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedPatent && (
        <PatentDetail
          patent={selectedPatent}
          onClose={() => setSelectedPatent(null)}
          onCreateAlert={handleCreateAlertFromPatent}
        />
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map(t => {
            const colors = TOAST_COLORS[t.type] || TOAST_COLORS.info;
            return (
              <div
                key={t.id}
                className="px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-xs"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {t.msg}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
