import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [patents, setPatents] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompetitors = useCallback(async () => {
    try {
      const data = await apiGet('/competitors');
      setCompetitors(data);
      return data;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const createCompetitor = useCallback(async (formData) => {
    const row = await apiPost('/competitors', formData);
    setCompetitors(prev => [row, ...prev]);
    return row;
  }, []);

  const updateCompetitor = useCallback(async (id, formData) => {
    const row = await apiPut(`/competitors/${id}`, formData);
    setCompetitors(prev => prev.map(c => c.id === id ? row : c));
    return row;
  }, []);

  const deleteCompetitor = useCallback(async (id) => {
    await apiDelete(`/competitors/${id}`);
    setCompetitors(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const checkCompetitor = useCallback(async (id) => {
    setChecking(true);
    try {
      const result = await apiPost(`/competitors/${id}/check`, {});
      setCompetitors(prev => prev.map(c =>
        c.id === id
          ? { ...c, total_patents: result.total_patents, new_patents: result.new_patents, last_checked: new Date().toISOString() }
          : c
      ));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setChecking(false);
    }
  }, []);

  const checkAll = useCallback(async (onProgress) => {
    setChecking(true);
    try {
      const result = await apiPost('/competitors/check-all', {});
      await fetchCompetitors();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setChecking(false);
    }
  }, [fetchCompetitors]);

  const fetchPatents = useCallback(async (id, newOnly = false) => {
    setLoading(true);
    try {
      const url = `/competitors/${id}/patents${newOnly ? '?new_only=true' : ''}`;
      const data = await apiGet(url);
      setPatents(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markSeen = useCallback(async (id) => {
    await apiPost(`/competitors/${id}/mark-seen`, {});
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, new_patents: 0 } : c));
    setPatents(prev => prev.map(p => ({ ...p, is_new: 0 })));
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await apiGet('/competitors/feed');
      setFeed(data);
      return data;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    competitors, selectedId, setSelectedId, patents, feed,
    loading, checking, error,
    fetchCompetitors, createCompetitor, updateCompetitor, deleteCompetitor,
    checkCompetitor, checkAll, fetchPatents, markSeen, fetchFeed,
  };
}
