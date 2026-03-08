import { useState, useCallback } from 'react';
import { apiPost, apiGet } from '../utils/api.js';

export function useImpact() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(async (clientId, clientPatentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost(`/clients/${clientId}/impact/analyze`, { clientPatentId });
      setAnalyses(data.analyses || []);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalyses = useCallback(async (clientId, clientPatentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/clients/${clientId}/impact/analyses/${clientPatentId}`);
      setAnalyses(data.analyses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAnalyses = useCallback(() => {
    setAnalyses([]);
    setError(null);
  }, []);

  return { analyses, loading, error, runAnalysis, fetchAnalyses, clearAnalyses };
}
