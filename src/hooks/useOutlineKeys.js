// encoding: utf-8
import React from 'react';
import { apiAuthFetch } from '../utils/api.js';

export default function useOutlineKeys() {
  const [keys, setKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState(null); // { bytesTransferredByUserId: { [id]: number } }
  const [server, setServer] = React.useState(null);   // server info (includes accessKeyDataLimit)

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch('/api/vpn/outline/keys');
      if (!res.ok) throw new Error(`Failed to load keys (${res.status})`);
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = React.useCallback(async () => {
    try {
      const res = await apiAuthFetch('/api/vpn/outline/metrics');
      if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`);
      const data = await res.json();
      setMetrics(data || null);
    } catch (e) {
      // Non-fatal for the page; keep metrics nullable
    }
  }, []);

  const loadServer = React.useCallback(async () => {
    try {
      const res = await apiAuthFetch('/api/vpn/outline/server');
      if (!res.ok) throw new Error(`Failed to load server (${res.status})`);
      const data = await res.json();
      setServer(data || null);
    } catch (e) {
      // ignore
    }
  }, []);

  const createKey = React.useCallback(async (name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch('/api/vpn/outline/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error(`Failed to create key (${res.status})`);
      // Refresh
      await load();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const deleteKey = React.useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/keys/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete key (${res.status})`);
      // Optimistic remove
      setKeys(prev => prev.filter(k => k.id !== id));
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const renameKey = React.useCallback(async (id, name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/keys/${encodeURIComponent(id)}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error(`Failed to rename key (${res.status})`);
      await load();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [load]);

  const setKeyLimit = React.useCallback(async (id, bytes) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/keys/${encodeURIComponent(id)}/data-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytes: Number(bytes) })
      });
      if (!res.ok) throw new Error(`Failed to set limit (${res.status})`);
      await loadServer();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadServer]);

  const clearKeyLimit = React.useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/keys/${encodeURIComponent(id)}/data-limit`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to clear limit (${res.status})`);
      await loadServer();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadServer]);

  const setGlobalLimit = React.useCallback(async (bytes) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/server/access-key-data-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytes: Number(bytes) })
      });
      if (!res.ok) throw new Error(`Failed to set global limit (${res.status})`);
      await loadServer();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadServer]);

  const clearGlobalLimit = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vpn/outline/server/access-key-data-limit`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to clear global limit (${res.status})`);
      await loadServer();
      return true;
    } catch (e) {
      setError(String(e.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadServer]);

  React.useEffect(() => {
    load();
    loadServer();
    loadMetrics();
  }, [load, loadServer, loadMetrics]);

  return {
    keys,
    loading,
    error,
    reload: async () => { await load(); await loadServer(); await loadMetrics(); },
    createKey,
    deleteKey,
    renameKey,
    metrics,
    server,
    setKeyLimit,
    clearKeyLimit,
    setGlobalLimit,
    clearGlobalLimit,
  };
}
