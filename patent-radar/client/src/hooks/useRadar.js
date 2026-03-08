import { useState, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';

export function useRadar() {
  const [scans, setScans] = useState([]);
  const [currentScan, setCurrentScan] = useState(null);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(new Set());
  const [error, setError] = useState(null);

  const runScan = useCallback(async (clientId) => {
    setScanning(true);
    setError(null);
    try {
      const data = await apiPost(`/clients/${clientId}/radar/scan`, {});
      setCurrentScan(data);
      setDiscoveredCompetitors(data.competitors || []);
      setScans(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setScanning(false);
    }
  }, []);

  const fetchScans = useCallback(async (clientId) => {
    try {
      const data = await apiGet(`/clients/${clientId}/radar/scans`);
      setScans(data);
      return data;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchScanDetail = useCallback(async (clientId, scanId) => {
    try {
      const data = await apiGet(`/clients/${clientId}/radar/scans/${scanId}`);
      setCurrentScan(data);
      setDiscoveredCompetitors(data.competitors || []);
      return data;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const importCompetitor = useCallback(async (clientId, scanId, discoveredId) => {
    setImporting(prev => new Set(prev).add(discoveredId));
    try {
      const data = await apiPost(`/clients/${clientId}/radar/scans/${scanId}/import/${discoveredId}`, {});
      setDiscoveredCompetitors(prev =>
        prev.map(c => c.id === discoveredId ? { ...c, imported: true } : c)
      );
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setImporting(prev => {
        const next = new Set(prev);
        next.delete(discoveredId);
        return next;
      });
    }
  }, []);

  return {
    scans,
    currentScan,
    discoveredCompetitors,
    scanning,
    importing,
    error,
    runScan,
    fetchScans,
    fetchScanDetail,
    importCompetitor,
  };
}
