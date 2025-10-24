// encoding: utf-8
import React from "react";
import { apiAuthFetch } from "../utils/api.js";

function normaliseKey(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    uuid: raw.uuid,
    name: raw.name || "",
    comment: raw.comment || "",
    created_at: raw.created_at,
    config_url: raw.config_url || "",
    stats_json: raw.stats_json || {},
  };
}

export default function useVlessKeys() {
  const [keys, setKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch("/api/vless/keys");
      if (!res.ok) throw new Error(`Failed to load keys (${res.status})`);
      const data = await res.json();
      const next = Array.isArray(data.keys) ? data.keys.map(normaliseKey).filter(Boolean) : [];
      setKeys(next);
    } catch (err) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createKey = React.useCallback(
    async ({ name, comment } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiAuthFetch("/api/vless/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name != null ? String(name) : "",
            comment: comment != null ? String(comment) : "",
          }),
        });
        if (!res.ok) throw new Error(`Failed to create key (${res.status})`);
        const data = await res.json();
        const key = normaliseKey(data.key);
        if (key) {
          setKeys((prev) => [key, ...prev]);
        } else {
          await load();
        }
        return true;
      } catch (err) {
        setError(err?.message || "Unexpected error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  const updateKey = React.useCallback(
    async (id, updates) => {
      if (!id) return false;
      setLoading(true);
      setError(null);
      try {
        const payload = {};
        if (updates?.name !== undefined) payload.name = updates.name;
        if (updates?.comment !== undefined) payload.comment = updates.comment;
        const res = await apiAuthFetch(`/api/vless/keys/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Failed to update key (${res.status})`);
        const data = await res.json();
        const key = normaliseKey(data.key);
        if (key) {
          setKeys((prev) => prev.map((item) => (item.id === key.id ? key : item)));
        } else {
          await load();
        }
        return true;
      } catch (err) {
        setError(err?.message || "Unexpected error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  const deleteKey = React.useCallback(async (id) => {
    if (!id) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch(`/api/vless/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete key (${res.status})`);
      setKeys((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      setError(err?.message || "Unexpected error");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    keys,
    loading,
    error,
    reload: load,
    createKey,
    updateKey,
    deleteKey,
  };
}
