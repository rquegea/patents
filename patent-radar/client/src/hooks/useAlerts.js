import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/alerts');
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlert = useCallback(async (name, query, filters = {}) => {
    try {
      const data = await apiPost('/alerts', { name, query, filters });
      setAlerts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteAlert = useCallback(async (id) => {
    try {
      await apiDelete(`/alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const checkAlert = useCallback(async (id) => {
    try {
      const data = await apiPost(`/alerts/${id}/check`, {});
      await fetchAlerts();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createAlert,
    deleteAlert,
    checkAlert
  };
}
