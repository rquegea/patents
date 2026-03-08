import { useState, useCallback, useRef } from 'react';
import { apiPost, apiGet } from '../utils/api';

export function usePatentSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const lastSearch = useRef(null);

  const search = useCallback(async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    lastSearch.current = { query, filters };
    try {
      const data = await apiPost('/patents/search', { query, filters });
      setResults(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastSearch.current || !results || loadingMore) return;
    if (results.patents.length >= results.total) return;

    setLoadingMore(true);
    try {
      const { query, filters } = lastSearch.current;
      const data = await apiPost('/patents/search', {
        query,
        filters: { ...filters, from: results.patents.length }
      });
      setResults(prev => ({
        ...prev,
        patents: [...prev.patents, ...data.patents],
        analytics: mergeAnalytics(prev.analytics, data.analytics),
        rateLimitInfo: data.rateLimitInfo || prev.rateLimitInfo,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [results, loadingMore]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiGet('/patents/search/history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    lastSearch.current = null;
  }, []);

  return {
    results,
    loading,
    loadingMore,
    error,
    history,
    search,
    loadMore,
    fetchHistory,
    clearResults
  };
}

function mergeAnalytics(prev, next) {
  if (!prev) return next;
  if (!next) return prev;
  return {
    byYear: mergeCount(prev.byYear, next.byYear),
    byCountry: mergeCount(prev.byCountry, next.byCountry),
    byApplicant: mergeCount(prev.byApplicant, next.byApplicant),
    byIPC: mergeCount(prev.byIPC, next.byIPC),
  };
}

function mergeCount(a = {}, b = {}) {
  const result = { ...a };
  for (const [key, val] of Object.entries(b)) {
    result[key] = (result[key] || 0) + val;
  }
  return result;
}
