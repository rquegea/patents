import { useEffect } from 'react';
import { useRadar } from '../hooks/useRadar';
import { formatDate } from '../utils/formatters';

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function RadarView({ clientId, clientName, technologyKeywords = [] }) {
  const {
    scans, currentScan, discoveredCompetitors, scanning, importing, error,
    runScan, fetchScans, fetchScanDetail, importCompetitor,
  } = useRadar();

  useEffect(() => {
    if (clientId) fetchScans(clientId);
  }, [clientId, fetchScans]);

  const hasKeywords = technologyKeywords.length > 0;

  const sorted = [...discoveredCompetitors].sort((a, b) => (b.patent_count || 0) - (a.patent_count || 0));

  const handleScan = async () => {
    if (!clientId || !hasKeywords) return;
    await runScan(clientId);
  };

  const handleImport = async (discoveredId) => {
    if (!clientId || !currentScan) return;
    await importCompetitor(clientId, currentScan.id, discoveredId);
  };

  const handleLoadScan = (scan) => {
    if (!clientId) return;
    fetchScanDetail(clientId, scan.id);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-y-auto">

      {/* a) Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Radar de Competidores</h2>
          {hasKeywords && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#d3e5ef] text-[#2eaadc]">
              {technologyKeywords.length} keywords
            </span>
          )}
        </div>
        {clientName && (
          <p className="text-xs text-text-secondary mt-0.5">{clientName}</p>
        )}
      </div>

      <div className="px-5 py-5 flex flex-col gap-6">

        {/* b) ADN Tecnológico */}
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">ADN Tecnológico</p>
          {hasKeywords ? (
            <div className="flex flex-wrap gap-1.5">
              {technologyKeywords.map((kw, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#d3e5ef] text-[#2eaadc]">{kw}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary leading-relaxed">
              Ve a <strong className="text-text-primary font-medium">Mi Empresa</strong> y extrae keywords de tus patentes primero.
            </p>
          )}
        </div>

        {/* c) Scan button */}
        <div>
          <button
            onClick={handleScan}
            disabled={!hasKeywords || scanning || !clientId}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-40 transition-colors"
          >
            {scanning && <Spinner />}
            {scanning ? 'Escaneando bases de datos mundiales...' : 'Buscar Competidores'}
          </button>
          {!clientId && (
            <p className="text-xs text-text-secondary mt-2">Selecciona un cliente para activar el radar.</p>
          )}
        </div>

        {/* d) Scan summary */}
        {currentScan && !scanning && (
          <div className="px-3 py-2 rounded-md bg-bg-panel border border-border text-xs text-text-secondary">
            <span className="text-text-primary font-medium">
              {currentScan.total_patents ?? discoveredCompetitors.reduce((s, c) => s + (c.patent_count || 0), 0)} patentes encontradas
            </span>
            {' '}de{' '}
            <span className="text-text-primary font-medium">{discoveredCompetitors.length} empresas</span>
          </div>
        )}

        {/* e) Discovered competitors */}
        {sorted.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">Competidores Encontrados</p>
            <div className="flex flex-col gap-2">
              {sorted.map((c) => {
                const isImporting = importing.has(c.id);
                const isImported = c.imported;
                return (
                  <div key={c.id} className="border border-border rounded-lg p-4 flex items-center justify-between gap-3 bg-bg-primary hover:bg-bg-panel transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{c.applicant_name || c.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {[c.country, c.patent_count != null ? `${c.patent_count} patentes` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleImport(c.id)}
                      disabled={isImporting || isImported}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-md transition-colors ${
                        isImported
                          ? 'bg-[#d1fae5] text-[#0f7b6c] cursor-default'
                          : 'border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-50'
                      }`}
                    >
                      {isImporting ? 'Importando...' : isImported ? '✓ Añadido' : 'Añadir a Vigilancia'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* f) Scan history */}
        {scans.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Historial de Escaneos</p>
            <div className="flex flex-col gap-0">
              {scans.map((s) => {
                const isActive = currentScan?.id === s.id;
                const competitorCount = s.discovered_competitors?.length ?? s.competitor_count ?? 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleLoadScan(s)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/60 last:border-0 transition-colors ${
                      isActive ? 'bg-bg-panel' : 'hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-text-primary">
                        {s.created_at ? formatDate(s.created_at) : 'Fecha desconocida'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {competitorCount} empresa{competitorCount !== 1 ? 's' : ''}
                        {s.total_patents != null ? ` · ${s.total_patents} patentes` : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-md bg-[#fde8e8] text-[#e03e3e] text-xs">{error}</div>
        )}
      </div>
    </div>
  );
}
