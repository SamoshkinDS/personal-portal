// encoding: utf-8
import React from "react";
import { apiAuthFetch } from "../utils/api.js";
import { idbPut, idbDelete, idbGetAll, idbClear } from "../utils/idb.js";

const STORE = "unread_notifications";

export default function useNotifications() {
  const [unread, setUnread] = React.useState([]);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelVisible, setPanelVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadUnreadFromIDB = React.useCallback(async () => {
    try {
      const items = await idbGetAll(STORE);
      items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setUnread(items);
    } catch (e) {
      console.warn("Failed to read notifications from IndexedDB", e);
    }
  }, []);

  const fetchFromServer = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch("/api/notifications?limit=100");
      if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
      const data = await res.json();
      const serverItems = (data.notifications || []).map((n) => ({
        id: `srv-${n.id}`,
        type: n.type || "log",
        title: n.title || "Событие системы",
        body: n.body || "",
        created_at: n.created_at,
      }));
      const current = await idbGetAll(STORE);
      const currentIds = new Set(current.map((item) => item.id));
      for (const item of serverItems) {
        if (!currentIds.has(item.id)) {
          await idbPut(STORE, item);
        }
      }
      await loadUnreadFromIDB();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [loadUnreadFromIDB]);

  const markRead = React.useCallback(async (id) => {
    await idbDelete(STORE, id);
    setUnread((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = React.useCallback(async () => {
    await idbClear(STORE);
    setUnread([]);
  }, []);

  React.useEffect(() => {
    loadUnreadFromIDB();
  }, [loadUnreadFromIDB]);

  const openPanel = React.useCallback(() => {
    setPanelVisible(true);
    setPanelOpen(true);
  }, []);

  const closePanel = React.useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setPanelVisible(false), 240);
  }, []);

  return {
    unread,
    unreadCount: unread.length,
    panelOpen,
    panelVisible,
    openPanel,
    closePanel,
    loading,
    error,
    fetchFromServer,
    markRead,
    markAllRead,
  };
}
