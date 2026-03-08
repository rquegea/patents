import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export function useClientVault() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const data = await apiGet('/clients');
      setClients(data);
      return data;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const createClient = useCallback(async (data) => {
    const row = await apiPost('/clients', data);
    setClients(prev => [row, ...prev]);
    setSelectedClient(row);
    return row;
  }, []);

  const updateClient = useCallback(async (id, data) => {
    const row = await apiPut(`/clients/${id}`, data);
    setClients(prev => prev.map(c => c.id === id ? row : c));
    setSelectedClient(prev => prev?.id === id ? row : prev);
    return row;
  }, []);

  const deleteClient = useCallback(async (id) => {
    await apiDelete(`/clients/${id}`);
    setClients(prev => prev.filter(c => c.id !== id));
    setSelectedClient(prev => prev?.id === id ? null : prev);
    setPatents([]);
  }, []);

  const fetchPatents = useCallback(async (clientId) => {
    setLoading(true);
    try {
      const data = await apiGet(`/clients/${clientId}/patents`);
      setPatents(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPatent = useCallback(async (clientId, data) => {
    const row = await apiPost(`/clients/${clientId}/patents`, data);
    setPatents(prev => [...prev, row]);
    return row;
  }, []);

  const lookupPatent = useCallback(async (clientId, patentNumber) => {
    return await apiPost(`/clients/${clientId}/patents/lookup`, { patent_number: patentNumber });
  }, []);

  const searchByApplicant = useCallback(async (clientId, applicantName, size = 20) => {
    return await apiPost(`/clients/${clientId}/patents/search-by-applicant`, {
      applicant_name: applicantName,
      size,
    });
  }, []);

  const deletePatent = useCallback(async (clientId, patentId) => {
    await apiDelete(`/clients/${clientId}/patents/${patentId}`);
    setPatents(prev => prev.filter(p => p.id !== patentId));
  }, []);

  const extractKeywords = useCallback(async (clientId, patentId) => {
    try {
      await apiPost(`/clients/${clientId}/patents/${patentId}/extract-keywords`, {});
    } catch (err) {
      // POST failed — still refresh so UI stays in sync
      console.error('extract-keywords failed:', err.message);
    }
    const data = await apiGet(`/clients/${clientId}/patents`);
    setPatents(data);
    return data;
  }, []);

  return {
    clients,
    selectedClient,
    setSelectedClient,
    patents,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    fetchPatents,
    addPatent,
    lookupPatent,
    searchByApplicant,
    deletePatent,
    extractKeywords,
  };
}
