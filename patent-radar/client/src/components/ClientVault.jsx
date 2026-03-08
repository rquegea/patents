import { useState, useEffect } from 'react';

const STATUS_BADGE = {
  active:   { bg: '#d1fae5', color: '#0f7b6c', label: 'Activa' },
  pending:  { bg: '#fef3c7', color: '#cb912f', label: 'Pendiente' },
  expired:  { bg: '#fde8e8', color: '#e03e3e', label: 'Expirada' },
  granted:  { bg: '#d1fae5', color: '#0f7b6c', label: 'Concedida' },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || { bg: '#f3f3f3', color: '#9b9a97', label: status || 'Desconocido' };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

const EMPTY_MANUAL = { title: '', claims_summary: '', claims: '', keywords: '', date: '', status: 'pending' };

function ManualForm({ manualForm, setManualForm, lookupResult, saving, onSubmit, inputCls }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {lookupResult && (
        <p className="text-xs text-accent mb-1">Datos obtenidos de Lens.org. Revisa y guarda.</p>
      )}
      <div>
        <label className="text-xs text-text-secondary mb-0.5 block">Título *</label>
        <input className={inputCls} value={manualForm.title} onChange={e => setManualForm(p => ({ ...p, title: e.target.value }))} placeholder="Título de la patente" required />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-0.5 block">Resumen de reivindicaciones</label>
        <textarea className={inputCls + ' resize-none'} rows={2} value={manualForm.claims_summary} onChange={e => setManualForm(p => ({ ...p, claims_summary: e.target.value }))} placeholder="Resumen de las reivindicaciones principales" />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-0.5 block">Reivindicaciones (una por línea)</label>
        <textarea className={inputCls + ' resize-none'} rows={3} value={manualForm.claims} onChange={e => setManualForm(p => ({ ...p, claims: e.target.value }))} placeholder={'Reivindicación 1\nReivindicación 2\n...'} />
      </div>
      <div>
        <label className="text-xs text-text-secondary mb-0.5 block">Keywords tecnológicos (uno por línea)</label>
        <textarea className={inputCls + ' resize-none'} rows={2} value={manualForm.keywords} onChange={e => setManualForm(p => ({ ...p, keywords: e.target.value }))} placeholder={'machine learning\ncomputer vision\n...'} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-text-secondary mb-0.5 block">Fecha</label>
          <input type="date" className={inputCls} value={manualForm.date} onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-secondary mb-0.5 block">Estado</label>
          <select className={inputCls} value={manualForm.status} onChange={e => setManualForm(p => ({ ...p, status: e.target.value }))}>
            <option value="pending">Pendiente</option>
            <option value="active">Activa</option>
            <option value="granted">Concedida</option>
            <option value="expired">Expirada</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={saving} className="mt-1 px-3 py-1.5 text-xs bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-50 transition-colors self-start">
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}

export default function ClientVault({
  clients, selectedClient, setSelectedClient, patents, loading, error,
  fetchClients, createClient, updateClient, deleteClient,
  fetchPatents, addPatent, lookupPatent, searchByApplicant, deletePatent, extractKeywords,
}) {
  // create-client form
  const [newForm, setNewForm] = useState({ name: '', sector: '', country: '' });
  const [creating, setCreating] = useState(false);

  // edit client
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // add patent — mode: 'number' | 'company' | 'manual'
  const [showAddPatent, setShowAddPatent] = useState(false);
  const [addMode, setAddMode] = useState('company'); // default to company search
  const [patentNumber, setPatentNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL);

  // company search
  const [applicantName, setApplicantName] = useState('');
  const [applicantResults, setApplicantResults] = useState(null); // { patents, total }
  const [applicantLoading, setApplicantLoading] = useState(false);
  const [importingIds, setImportingIds] = useState(new Set());
  const [importedIds, setImportedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // extract keywords
  const [extractingId, setExtractingId] = useState(null);
  const [extractingAll, setExtractingAll] = useState(false);
  const [extractAllProgress, setExtractAllProgress] = useState(null); // { done, total }

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClient) {
      fetchPatents(selectedClient.id);
    }
  }, [selectedClient, fetchPatents]);

  // ── Create client ──────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    setCreating(true);
    try {
      await createClient(newForm);
      setNewForm({ name: '', sector: '', country: '' });
    } finally {
      setCreating(false);
    }
  };

  // ── Edit client ────────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditForm({ name: selectedClient.name, sector: selectedClient.sector || '', country: selectedClient.country || '' });
    setEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateClient(selectedClient.id, editForm);
    setEditing(false);
  };

  // ── Search by applicant ────────────────────────────────────────────────────
  const handleApplicantSearch = async () => {
    if (!applicantName.trim()) return;
    setApplicantLoading(true);
    setApplicantResults(null);
    try {
      const data = await searchByApplicant(selectedClient.id, applicantName.trim());
      setApplicantResults(data);
    } catch (err) {
      setApplicantResults({ patents: [], total: 0, error: err.message });
    } finally {
      setApplicantLoading(false);
    }
  };

  const handleImportApplicantPatent = async (p) => {
    setImportingIds(prev => new Set(prev).add(p.lens_id));
    try {
      await addPatent(selectedClient.id, {
        patent_number: p.doc_number,
        title: p.title,
        claims_summary: p.abstract,
        technology_keywords: p.ipc_codes || [],
        filing_date: p.date_published,
        status: p.status,
      });
      setImportedIds(prev => new Set(prev).add(p.lens_id));
    } finally {
      setImportingIds(prev => { const n = new Set(prev); n.delete(p.lens_id); return n; });
    }
  };

  // ── Lookup patent ──────────────────────────────────────────────────────────
  const handleLookup = async () => {
    if (!patentNumber.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    setManualMode(false);
    try {
      const data = await lookupPatent(selectedClient.id, patentNumber.trim());
      if (data) {
        setLookupResult(data);
        setManualForm({
          title: data.title || '',
          claims_summary: data.claims_summary || data.abstract || '',
          claims: Array.isArray(data.claims) ? data.claims.join('\n') : (data.claims || ''),
          keywords: Array.isArray(data.technology_keywords) ? data.technology_keywords.join('\n') : '',
          date: data.date_filed || data.date_published || '',
          status: data.status || 'pending',
        });
        setManualMode(true);
      }
    } catch {
      setManualMode(true);
      setManualForm({ ...EMPTY_MANUAL, title: '' });
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Save patent ────────────────────────────────────────────────────────────
  const handleSavePatent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...manualForm,
        pub_number: patentNumber.trim() || undefined,
        claims: manualForm.claims ? manualForm.claims.split('\n').map(s => s.trim()).filter(Boolean) : [],
        technology_keywords: manualForm.keywords ? manualForm.keywords.split('\n').map(s => s.trim()).filter(Boolean) : [],
      };
      delete payload.keywords;
      await addPatent(selectedClient.id, payload);
      setShowAddPatent(false);
      setPatentNumber('');
      setManualForm(EMPTY_MANUAL);
      setManualMode(false);
      setLookupResult(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Extract keywords ───────────────────────────────────────────────────────
  const handleExtract = async (patentId) => {
    setExtractingId(patentId);
    try {
      await extractKeywords(selectedClient.id, patentId);
    } finally {
      setExtractingId(null);
    }
  };

  const handleExtractAll = async () => {
    const pending = patents;
    if (pending.length === 0) return;
    setExtractingAll(true);
    setExtractAllProgress({ done: 0, total: pending.length });
    for (let i = 0; i < pending.length; i++) {
      setExtractingId(pending[i].id);
      try {
        await extractKeywords(selectedClient.id, pending[i].id);
      } catch (_) {}
      setExtractAllProgress({ done: i + 1, total: pending.length });
    }
    setExtractingId(null);
    setExtractingAll(false);
    setExtractAllProgress(null);
    await fetchPatents(selectedClient.id);
  };

  // ── Aggregated DNA ─────────────────────────────────────────────────────────
  const allKeywords = [...new Set(
    patents.flatMap(p => Array.isArray(p.technology_keywords) ? p.technology_keywords : [])
  )];

  // ── Input class ────────────────────────────────────────────────────────────
  const inputCls = 'w-full border border-border rounded-md px-3 py-1.5 text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-accent text-text-primary';

  // ═══════════════════════════════════════════════════════════════════════════
  // A) No client exists yet
  // ═══════════════════════════════════════════════════════════════════════════
  if (!selectedClient) {
    return (
      <div className="flex flex-col h-full bg-bg-primary">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Tu Bóveda de Patentes</h2>
          <p className="text-xs text-text-secondary mt-0.5">Gestiona tus patentes propias y extrae su ADN tecnológico.</p>
        </div>

        {clients.length > 0 && (
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs text-text-secondary mb-2">Clientes existentes</p>
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className="w-full text-left px-3 py-2 mb-1 rounded-md border border-border text-sm text-text-primary hover:bg-bg-hover transition-colors"
              >
                {c.name}
                {c.sector && <span className="text-text-secondary ml-2 text-xs">· {c.sector}</span>}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="px-5 py-5 flex flex-col gap-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Nuevo Cliente</p>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Nombre del cliente *</label>
            <input
              className={inputCls}
              placeholder="Ej. Acme Corp"
              value={newForm.name}
              onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Sector</label>
            <input
              className={inputCls}
              placeholder="Ej. Biotecnología"
              value={newForm.sector}
              onChange={e => setNewForm(p => ({ ...p, sector: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">País</label>
            <input
              className={inputCls}
              placeholder="Ej. España"
              value={newForm.country}
              onChange={e => setNewForm(p => ({ ...p, country: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-1 px-4 py-2 text-sm bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-50 transition-colors self-start"
          >
            {creating ? 'Creando...' : 'Crear Cliente'}
          </button>
        </form>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // B-E) Client selected
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-y-auto">

      {/* B) Client header */}
      <div className="px-5 py-4 border-b border-border">
        {editing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-2">
            <input className={inputCls} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre" required />
            <input className={inputCls} value={editForm.sector} onChange={e => setEditForm(p => ({ ...p, sector: e.target.value }))} placeholder="Sector" />
            <input className={inputCls} value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} placeholder="País" />
            <div className="flex gap-2 mt-1">
              <button type="submit" className="px-3 py-1.5 text-xs bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] transition-colors">Guardar</button>
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors">Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <h2 className="text-sm font-semibold text-text-primary">{selectedClient.name}</h2>
              </div>
              <p className="text-xs text-text-secondary mt-0.5 ml-4">
                {[selectedClient.sector, selectedClient.country].filter(Boolean).join(' · ') || 'Sin sector ni país'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={startEdit} className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors">
                Editar
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
              >
                Cambiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* C) Patents section */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Patentes Protegidas {patents.length > 0 && `(${patents.length})`}
          </p>
          <div className="flex items-center gap-3">
            {patents.length > 0 && (
              <button
                onClick={handleExtractAll}
                disabled={extractingAll || !!extractingId}
                className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
              >
                {extractingAll
                  ? `Extrayendo ${extractAllProgress?.done}/${extractAllProgress?.total}...`
                  : 'Extraer keywords de todas'}
              </button>
            )}
          <button
            onClick={() => { setShowAddPatent(v => !v); setManualMode(false); setLookupResult(null); setPatentNumber(''); setManualForm(EMPTY_MANUAL); setApplicantResults(null); setApplicantName(''); setImportingIds(new Set()); setImportedIds(new Set()); }}
            className="text-xs text-accent hover:underline transition-colors"
          >
            {showAddPatent ? 'Cancelar' : '+ Añadir Patente'}
          </button>
          </div>
        </div>

        {/* D) Add patent inline form */}
        {showAddPatent && (
          <div className="mb-4 rounded-lg border border-border bg-bg-panel overflow-hidden">
            {/* Mode tabs */}
            <div className="flex border-b border-border">
              {[
                { id: 'company', label: 'Por empresa' },
                { id: 'number', label: 'Por número' },
                { id: 'manual', label: 'Manual' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setAddMode(m.id); setManualMode(m.id === 'manual'); setLookupResult(null); }}
                  className={`px-3 py-2 text-xs relative transition-colors ${addMode === m.id ? 'text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {m.label}
                  {addMode === m.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-primary rounded-full" />}
                </button>
              ))}
            </div>

            <div className="p-3">
              {/* ── Company search mode ── */}
              {addMode === 'company' && (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder={`Ej. ${selectedClient?.name || 'TOLSA'}`}
                      value={applicantName}
                      onChange={e => setApplicantName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplicantSearch()}
                    />
                    <button
                      type="button"
                      onClick={handleApplicantSearch}
                      disabled={applicantLoading || !applicantName.trim()}
                      className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md disabled:opacity-40 whitespace-nowrap transition-colors"
                    >
                      {applicantLoading ? 'Buscando...' : 'Buscar en Lens.org'}
                    </button>
                  </div>

                  {applicantResults && (
                    <>
                      {applicantResults.error ? (
                        <p className="text-xs text-[#e03e3e]">{applicantResults.error}</p>
                      ) : applicantResults.patents.length === 0 ? (
                        <p className="text-xs text-text-secondary">No se encontraron patentes para "{applicantName}".</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-secondary">
                              {applicantResults.total} patentes encontradas · mostrando {applicantResults.patents.length}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                for (const p of applicantResults.patents) {
                                  if (!importedIds.has(p.lens_id) && !patents.some(ep => ep.patent_number === p.doc_number)) {
                                    await handleImportApplicantPatent(p);
                                  }
                                }
                              }}
                              disabled={applicantResults.patents.every(p => importedIds.has(p.lens_id) || patents.some(ep => ep.patent_number === p.doc_number))}
                              className="px-2.5 py-1 text-xs bg-text-primary text-white rounded-md hover:bg-[#2f2f2f] disabled:opacity-40 transition-colors"
                            >
                              Añadir todas
                            </button>
                          </div>
                          <div className="flex flex-col gap-0 max-h-72 overflow-y-auto -mx-3 px-3">
                            {applicantResults.patents.map(p => {
                              const isImporting = importingIds.has(p.lens_id);
                              const isImported = importedIds.has(p.lens_id) ||
                                patents.some(ep => ep.patent_number === p.doc_number);
                              return (
                                <div key={p.lens_id} className="flex items-start justify-between gap-2 py-2 border-b border-border/60 last:border-0">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2">{p.title || 'Sin título'}</p>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                      {[p.doc_number, p.jurisdiction, p.date_published?.slice(0, 4)].filter(Boolean).join(' · ')}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleImportApplicantPatent(p)}
                                    disabled={isImporting || isImported}
                                    className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-md transition-colors ${
                                      isImported
                                        ? 'bg-[#d1fae5] text-[#0f7b6c] cursor-default'
                                        : 'border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-50'
                                    }`}
                                  >
                                    {isImporting ? '...' : isImported ? '✓' : 'Añadir'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Number lookup mode ── */}
              {addMode === 'number' && (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder="Número de patente (ej. WO2023123456)"
                      value={patentNumber}
                      onChange={e => setPatentNumber(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    />
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={lookupLoading || !patentNumber.trim()}
                      className="px-3 py-1.5 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md disabled:opacity-40 whitespace-nowrap transition-colors"
                    >
                      {lookupLoading ? 'Buscando...' : 'Buscar en Lens.org'}
                    </button>
                  </div>
                  {manualMode && (
                    <ManualForm
                      manualForm={manualForm}
                      setManualForm={setManualForm}
                      lookupResult={lookupResult}
                      saving={saving}
                      onSubmit={handleSavePatent}
                      inputCls={inputCls}
                    />
                  )}
                </div>
              )}

              {/* ── Manual mode ── */}
              {addMode === 'manual' && (
                <ManualForm
                  manualForm={manualForm}
                  setManualForm={setManualForm}
                  lookupResult={null}
                  saving={saving}
                  onSubmit={handleSavePatent}
                  inputCls={inputCls}
                />
              )}
            </div>
          </div>
        )}

        {/* Patent list */}
        {loading ? (
          <div className="py-8 text-center text-sm text-text-secondary">Cargando patentes...</div>
        ) : patents.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">
            No hay patentes registradas.<br />
            <span className="text-xs">Añade la primera patente para comenzar.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {patents.map(p => {
              const keywords = Array.isArray(p.technology_keywords) ? p.technology_keywords : [];
              const isExtracting = extractingId === p.id;
              return (
                <div key={p.id} className="py-3 border-b border-border/60 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.patent_number && (
                          <span className="text-xs font-mono text-text-secondary">{p.patent_number}</span>
                        )}
                        <span className="text-sm text-text-primary font-medium truncate">{p.title || 'Sin título'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.date_filed && <span className="text-xs text-text-secondary">{p.date_filed.slice(0, 10)}</span>}
                        <StatusBadge status={p.status} />
                      </div>
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {keywords.map((kw, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#d3e5ef] text-[#2eaadc]">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleExtract(p.id)}
                        disabled={!!extractingId}
                        className="px-2.5 py-1 text-xs border border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md disabled:opacity-50 whitespace-nowrap transition-colors"
                      >
                        {isExtracting ? 'Extrayendo...' : 'Extraer Keywords con IA'}
                      </button>
                      <button
                        onClick={() => deletePatent(selectedClient.id, p.id)}
                        className="p-1 text-[#e03e3e] hover:bg-[#fbe4e4] rounded transition-colors"
                        title="Eliminar patente"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* E) Technological DNA */}
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">ADN Tecnológico</p>
        {allKeywords.length === 0 ? (
          <p className="text-xs text-text-secondary leading-relaxed">
            Extrae keywords de tus patentes para activar el radar automático.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allKeywords.map((kw, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#d3e5ef] text-[#2eaadc]">{kw}</span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-5 mb-4 px-3 py-2 rounded-md bg-[#fde8e8] text-[#e03e3e] text-xs">{error}</div>
      )}
    </div>
  );
}
