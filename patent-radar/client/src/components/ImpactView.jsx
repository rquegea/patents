import { useState, useEffect } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useImpact } from '../hooks/useImpact';

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

const THREAT_STYLES = {
  high:   { badge: 'bg-[#fde8e8] text-[#e03e3e]',   dot: '#e03e3e', label: 'Alto' },
  medium: { badge: 'bg-[#fbecdd] text-[#cb912f]',   dot: '#cb912f', label: 'Medio' },
  low:    { badge: 'bg-[#d1fae5] text-[#0f7b6c]',   dot: '#0f7b6c', label: 'Bajo' },
  none:   { badge: 'bg-bg-panel text-text-secondary', dot: '#9b9a97', label: 'Ninguno' },
};

function ThreatBadge({ level }) {
  const style = THREAT_STYLES[level] || THREAT_STYLES.none;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
      {style.label}
    </span>
  );
}

function ScoreBadge({ label, value, color }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${color}`}>
      {label} {value}
    </span>
  );
}

function highlightKeywords(text, keywords) {
  if (!text || !keywords.length) return text;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-[#fef9c3] text-text-primary rounded px-0.5">{part}</mark>
      : part
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-bg-primary border border-border rounded-md px-3 py-2 shadow-lg text-xs max-w-[200px]">
      <p className="font-medium text-text-primary truncate">{d.discovered_patent_applicant || 'Desconocido'}</p>
      <p className="text-text-secondary mt-0.5 line-clamp-2">{d.discovered_patent_title}</p>
      <div className="flex gap-2 mt-1.5">
        <span className="text-text-secondary">Overlap: <strong>{d.overlap_score}</strong></span>
        <span className="text-text-secondary">Prox: <strong>{d.tech_proximity_score}</strong></span>
      </div>
    </div>
  );
}

export default function ImpactView({ clientId, clientName, patents = [] }) {
  const { analyses, loading, error, runAnalysis, fetchAnalyses, clearAnalyses } = useImpact();
  const [selectedPatentId, setSelectedPatentId] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [rightTab, setRightTab] = useState('map');

  // Auto-select first patent
  useEffect(() => {
    if (patents.length > 0 && !selectedPatentId) {
      setSelectedPatentId(String(patents[0].id));
    }
  }, [patents, selectedPatentId]);

  // Load cached analyses when patent changes
  useEffect(() => {
    if (clientId && selectedPatentId) {
      clearAnalyses();
      setSelectedAnalysis(null);
      fetchAnalyses(clientId, selectedPatentId);
    }
  }, [clientId, selectedPatentId, fetchAnalyses, clearAnalyses]);

  const handleAnalyze = async () => {
    if (!clientId || !selectedPatentId) return;
    const result = await runAnalysis(clientId, selectedPatentId);
    if (result?.new_analyzed === 0) {
      // All cached, nothing to notify
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAnalysis = (a) => {
    setSelectedAnalysis(a);
    setRightTab('detail');
  };

  const handleDotClick = (data) => {
    if (data?.activePayload?.[0]?.payload) {
      setSelectedAnalysis(data.activePayload[0].payload);
      setRightTab('detail');
    }
  };

  const selectedClientPatent = patents.find(p => String(p.id) === selectedPatentId);
  const clientKeywords = Array.isArray(selectedClientPatent?.technology_keywords)
    ? selectedClientPatent.technology_keywords
    : [];

  const highCount = analyses.filter(a => a.threat_level === 'high').length;
  const medCount  = analyses.filter(a => a.threat_level === 'medium').length;

  if (!clientId) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="text-center max-w-sm">
          <p className="text-sm text-text-secondary">
            Selecciona un cliente para usar el Análisis de Impacto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Análisis de Impacto</h2>
          {clientName && <p className="text-xs text-text-secondary mt-0.5">{clientName}</p>}
        </div>
        {analyses.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {highCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#fde8e8] text-[#e03e3e] font-medium">
                {highCount} alto{highCount !== 1 ? 's' : ''}
              </span>
            )}
            {medCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#fbecdd] text-[#cb912f] font-medium">
                {medCount} medio{medCount !== 1 ? 's' : ''}
              </span>
            )}
            <span>{analyses.length} patentes analizadas</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedPatentId}
          onChange={e => setSelectedPatentId(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent max-w-sm"
        >
          {patents.length === 0 && <option value="">Sin patentes</option>}
          {patents.map(p => (
            <option key={p.id} value={String(p.id)}>
              {p.patent_number} — {p.title || 'Sin título'}
            </option>
          ))}
        </select>

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedPatentId || patents.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-40 transition-colors"
        >
          {loading && <Spinner />}
          {loading ? 'Analizando...' : 'Analizar Impacto'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-md bg-[#fde8e8] text-[#e03e3e] text-xs">{error}</div>
      )}

      {/* Empty state */}
      {!loading && analyses.length === 0 && !error && (
        <div className="px-4 py-8 rounded-lg border border-border bg-bg-panel text-center">
          <p className="text-sm text-text-secondary">
            Selecciona una patente propia y haz clic en <strong className="text-text-primary">Analizar Impacto</strong> para comparar contra las patentes descubiertas por el Radar.
          </p>
        </div>
      )}

      {/* Main grid */}
      {analyses.length > 0 && (
        <div className="flex gap-6" style={{ minHeight: '600px' }}>

          {/* Left: Ranking */}
          <div className="w-[40%] flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '75vh' }}>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
              Ranking de Amenazas
            </p>
            {analyses.map((a) => {
              const isSelected = selectedAnalysis?.id === a.id;
              const isExpanded = expandedIds.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-text-primary bg-bg-panel'
                      : 'border-border bg-bg-primary hover:bg-bg-panel'
                  }`}
                  onClick={() => handleSelectAnalysis(a)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {a.discovered_patent_applicant || 'Desconocido'}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                        {a.discovered_patent_title || a.discovered_patent_lens_id}
                      </p>
                    </div>
                    <ThreatBadge level={a.threat_level} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <ScoreBadge
                      label="Overlap"
                      value={a.overlap_score}
                      color="bg-[#d3e5ef] text-[#2eaadc]"
                    />
                    <ScoreBadge
                      label="Prox"
                      value={a.tech_proximity_score}
                      color="bg-bg-panel text-text-secondary"
                    />
                    <span className="text-xs text-text-secondary ml-auto">
                      {a.threat_score?.toFixed(0)} pts
                    </span>
                  </div>

                  {a.explanation && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleExpand(a.id); }}
                      className="mt-2 text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
                    >
                      <span>{isExpanded ? '▲' : '▼'}</span>
                      <span>Explicación IA</span>
                    </button>
                  )}
                  {isExpanded && a.explanation && (
                    <p className="mt-1.5 text-xs text-text-secondary leading-relaxed border-t border-border pt-2">
                      {a.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Map + Detail */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-border mb-4">
              {[
                { id: 'map', label: 'Mapa de Proximidad' },
                { id: 'detail', label: 'Detalle' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`px-3 py-2 text-sm relative transition-colors ${
                    rightTab === tab.id
                      ? 'text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {rightTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Scatter chart */}
            {rightTab === 'map' && (
              <div className="flex-1">
                <p className="text-xs text-text-secondary mb-3">
                  Haz clic en un punto para ver el detalle. Cada punto es una patente competidora.
                </p>
                <ResponsiveContainer width="100%" height={460}>
                  <ScatterChart
                    margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
                    onClick={handleDotClick}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" />
                    <XAxis
                      type="number"
                      dataKey="tech_proximity_score"
                      domain={[0, 100]}
                      name="Proximidad tecnológica"
                      label={{ value: 'Proximidad tecnológica', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#9b9a97' }}
                      tick={{ fontSize: 11, fill: '#9b9a97' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="overlap_score"
                      domain={[0, 100]}
                      name="Solapamiento de claims"
                      label={{ value: 'Solapamiento de claims', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9b9a97' }}
                      tick={{ fontSize: 11, fill: '#9b9a97' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter data={analyses} cursor="pointer">
                      {analyses.map((a) => {
                        const isSelected = selectedAnalysis?.id === a.id;
                        const color = THREAT_STYLES[a.threat_level]?.dot || '#9b9a97';
                        return (
                          <Cell
                            key={a.id}
                            fill={color}
                            fillOpacity={isSelected ? 1 : 0.7}
                            stroke={isSelected ? '#37352f' : color}
                            strokeWidth={isSelected ? 2 : 1}
                            r={isSelected ? 8 : 6}
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex gap-4 justify-center mt-2">
                  {Object.entries(THREAT_STYLES).map(([level, style]) => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.dot }} />
                      <span className="text-xs text-text-secondary">{style.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail side-by-side */}
            {rightTab === 'detail' && (
              <div className="flex-1">
                {!selectedAnalysis ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-sm text-text-secondary">
                      Selecciona una patente del ranking para ver el detalle.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <p className="text-xs font-medium text-text-primary">{selectedAnalysis.discovered_patent_applicant || 'Desconocido'}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{selectedAnalysis.discovered_patent_title}</p>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <ThreatBadge level={selectedAnalysis.threat_level} />
                      </div>
                    </div>

                    {selectedAnalysis.explanation && (
                      <div className="px-3 py-2 rounded-md bg-bg-panel border border-border text-xs text-text-secondary leading-relaxed">
                        <strong className="text-text-primary">Análisis IA:</strong> {selectedAnalysis.explanation}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Client patent */}
                      <div className="border border-border rounded-lg p-3">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                          Tu Patente
                        </p>
                        <p className="text-xs font-semibold text-text-primary mb-2">
                          {selectedClientPatent?.title || 'Sin título'}
                        </p>
                        <div className="text-xs text-text-secondary leading-relaxed space-y-1">
                          {selectedClientPatent?.claims_summary && (
                            <p>{highlightKeywords(selectedClientPatent.claims_summary, clientKeywords)}</p>
                          )}
                          {Array.isArray(selectedClientPatent?.key_claims) && selectedClientPatent.key_claims.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-text-primary mb-1">Claims clave:</p>
                              <ul className="space-y-1">
                                {selectedClientPatent.key_claims.slice(0, 4).map((c, i) => (
                                  <li key={i} className="pl-2 border-l border-border">
                                    {highlightKeywords(c, clientKeywords)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Discovered patent */}
                      <div className="border border-border rounded-lg p-3">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                          Patente Competidora
                        </p>
                        <p className="text-xs font-semibold text-text-primary mb-2">
                          {selectedAnalysis.discovered_patent_title || 'Sin título'}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {/* Abstract is not stored, so show scores + lens_id */}
                          <span className="text-text-secondary">ID Lens: </span>
                          <a
                            href={`https://www.lens.org/lens/patent/${selectedAnalysis.discovered_patent_lens_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            {selectedAnalysis.discovered_patent_lens_id}
                          </a>
                        </p>

                        <div className="mt-3 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary">Solapamiento de claims</span>
                            <span className="font-mono font-medium text-text-primary">{selectedAnalysis.overlap_score}/100</span>
                          </div>
                          <div className="w-full bg-bg-panel rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${selectedAnalysis.overlap_score}%`,
                                backgroundColor: THREAT_STYLES[selectedAnalysis.threat_level]?.dot || '#9b9a97',
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-text-secondary">Proximidad tecnológica</span>
                            <span className="font-mono font-medium text-text-primary">{selectedAnalysis.tech_proximity_score}/100</span>
                          </div>
                          <div className="w-full bg-bg-panel rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-[#2eaadc]"
                              style={{ width: `${selectedAnalysis.tech_proximity_score}%` }}
                            />
                          </div>
                        </div>

                        {clientKeywords.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-text-primary mb-1">Keywords propias:</p>
                            <div className="flex flex-wrap gap-1">
                              {clientKeywords.slice(0, 8).map((kw, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#d3e5ef] text-[#2eaadc]">{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
