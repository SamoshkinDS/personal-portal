// encoding: utf-8
import React from "react";
import { apiAuthFetch } from "../utils/api.js";
import { idbPut, idbDelete, idbGetAll, idbClear, IDB_STORES } from "../utils/idb.js";

const UNREAD_STORE = IDB_STORES.UNREAD;
const READ_STORE = IDB_STORES.READ;
const READ_HISTORY_LIMIT = 500;

export default function useNotifications() {
  const [unread, setUnread] = React.useState([]);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelVisible, setPanelVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadUnreadFromIDB = React.useCallback(async () => {
    try {
      const items = await idbGetAll(UNREAD_STORE);
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
      const current = await idbGetAll(UNREAD_STORE);
      const currentIds = new Set(current.map((item) => item.id));
      const readIds = await loadReadIds();
      for (const item of serverItems) {
        if (readIds.has(item.id)) continue;
        if (!currentIds.has(item.id)) {
          await idbPut(UNREAD_STORE, item);
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
    setUnread((prev) => prev.filter((n) => n.id !== id));
    try {
      await idbDelete(UNREAD_STORE, id);
      await rememberAsRead([id]);
    } catch (e) {
      console.warn("Failed to persist read notification state", e);
    }
  }, []);

  const markAllRead = React.useCallback(async () => {
    const ids = unread.map((n) => n.id);
    setUnread([]);
    try {
      await idbClear(UNREAD_STORE);
      await rememberAsRead(ids);
    } catch (e) {
      console.warn("Failed to persist read notifications", e);
    }
  }, [unread]);

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

async function loadReadIds() {
  try {
    const items = await idbGetAll(READ_STORE);
    return new Set(items.map((item) => item.id));
  } catch (e) {
    console.warn("Failed to read notification history", e);
    return new Set();
  }
}

async function rememberAsRead(ids) {
  if (!ids || ids.length === 0) return;
  const timestamp = Date.now();
  try {
    await Promise.all(
      ids.map((id, index) => idbPut(READ_STORE, { id, read_at: timestamp + index }))
    );
    await trimReadHistory();
  } catch (e) {
    console.warn("Failed to store read notifications", e);
  }
}

async function trimReadHistory() {
  try {
    const rows = await idbGetAll(READ_STORE);
    if (rows.length <= READ_HISTORY_LIMIT) return;
    rows.sort((a, b) => (b.read_at || 0) - (a.read_at || 0));
    const stale = rows.slice(READ_HISTORY_LIMIT);
    await Promise.all(stale.map((row) => idbDelete(READ_STORE, row.id)));
  } catch (e) {
    console.warn("Failed to trim read notification history", e);
  }
}
