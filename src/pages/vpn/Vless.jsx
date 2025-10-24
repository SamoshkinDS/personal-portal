// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import PageShell from "../../components/PageShell.jsx";
import useVlessKeys from "../../hooks/useVlessKeys.js";
import { apiAuthFetch } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const MB = 1024 * 1024;
const GB = MB * 1024;
const DEFAULT_STATS_SCOPE = "aggregate";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatBytes(value) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const decimals = size >= 10 ? 0 : 1;
  return `${size.toFixed(decimals)} ${units[unit]}`;
}

function toMB(value) {
  return Number.isFinite(value) ? value / MB : 0;
}

function toGB(value) {
  return Number.isFinite(value) ? value / GB : 0;
}

function StatsTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-slate-900/90 p-3 text-xs text-slate-100 shadow-lg">
      <div className="font-semibold text-indigo-300">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mt-1 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>
            {entry.name}: {entry.value.toFixed(2)} MB
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Vless() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ALL" || (user?.permissions || []).includes("admin_access");

  const { keys, loading, error, reload, createKey, updateKey, deleteKey } = useVlessKeys();

  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newComment, setNewComment] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingComment, setEditingComment] = React.useState("");
  const [copyHint, setCopyHint] = React.useState(null);

  const [stats, setStats] = React.useState(null);
  const [statsLabel, setStatsLabel] = React.useState("All VLESS keys");
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [statsError, setStatsError] = React.useState(null);

  const [history, setHistory] = React.useState([]);
  const [historyRange, setHistoryRange] = React.useState(7);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (!copyHint) return undefined;
    const timer = setTimeout(() => setCopyHint(null), 3000);
    return () => clearTimeout(timer);
  }, [copyHint]);

  const fetchStats = React.useCallback(async () => {
    if (!isAdmin) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await apiAuthFetch(`/api/vless/stats/${encodeURIComponent(DEFAULT_STATS_SCOPE)}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.error || payload?.message || `Failed to load stats (${res.status})`;
        throw new Error(message);
      }
      const info = payload?.stats || null;
      if (info) {
        setStats(info);
        const label = info.label || info.tag || "All VLESS keys";
        setStatsLabel(label);
      } else {
        setStats(null);
        setStatsLabel("All VLESS keys");
      }
      setLastUpdated(new Date());
    } catch (err) {
      setStats(null);
      setStatsLabel("All VLESS keys");
      setStatsError(err?.message || "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, [isAdmin]);

  const fetchHistory = React.useCallback(
    async (rangeValue) => {
      if (!isAdmin) return;
      const value = Number(rangeValue) === 30 ? 30 : 7;
      setHistoryLoading(true);
      try {
        const res = await apiAuthFetch(
          `/api/vless/stats/history/${encodeURIComponent(DEFAULT_STATS_SCOPE)}?range=${value}`
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = payload?.message || `Failed to load history (${res.status})`;
          throw new Error(message);
        }
        const list = Array.isArray(payload?.history)
          ? payload.history.map((entry) => ({
              id: entry.id || entry.created_at,
              uplink: Number(entry.uplink || 0),
              downlink: Number(entry.downlink || 0),
              total: Number(entry.total || 0),
              created_at: entry.created_at,
            }))
          : [];
        setHistory(list);
      } catch (err) {
        setStatsError(err?.message || "Failed to load stats history");
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [isAdmin]
  );

  React.useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
  }, [isAdmin, fetchStats]);

  React.useEffect(() => {
    if (!isAdmin) return;
    fetchHistory(historyRange);
  }, [isAdmin, fetchHistory, historyRange]);

  const handleRangeChange = (value) => {
    setHistoryRange(value);
  };

  const handleSyncStats = async () => {
    if (!isAdmin) return;
    setSyncing(true);
    setStatsError(null);
    try {
      const res = await apiAuthFetch("/api/vless/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.error || payload?.message || `Failed to sync stats (${res.status})`;
        throw new Error(message);
      }
      await fetchStats();
      await fetchHistory(historyRange);
    } catch (err) {
      setStatsError(err?.message || "Failed to update stats");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: newName.trim(),
      comment: newComment.trim(),
    };
    if (!payload.name) return;
    const ok = await createKey(payload);
    if (ok) {
      setNewName("");
      setNewComment("");
      setIsCreating(false);
    }
  };

  const startEditing = (key) => {
    setEditingId(key.id);
    setEditingName(key.name);
    setEditingComment(key.comment || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingComment("");
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;
    const payload = {
      name: editingName.trim(),
      comment: editingComment.trim(),
    };
    const ok = await updateKey(editingId, payload);
    if (ok) {
      cancelEditing();
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete key "${key.name || key.uuid}"?`)) return;
    await deleteKey(key.id);
  };

  const handleCopy = async (key) => {
    if (!key?.config_url) return;
    try {
      await navigator.clipboard.writeText(key.config_url);
      setCopyHint(`Connection string copied (${key.name || key.uuid})`);
    } catch (err) {
      console.error("Clipboard write failed", err);
      setCopyHint("Clipboard is not available");
    }
  };

  const uplinkMB = toMB(stats?.uplink || 0);
  const downlinkMB = toMB(stats?.downlink || 0);
  const totalGB = toGB(stats?.total || 0);

  const chartData = React.useMemo(
    () =>
      history.map((entry) => {
        const date = entry.created_at ? new Date(entry.created_at) : null;
        const label = date
          ? date.toLocaleString("ru-RU", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        return {
          label,
          uplinkMB: toMB(entry.uplink),
          downlinkMB: toMB(entry.downlink),
          totalMB: toMB(entry.total),
        };
      }),
    [history]
  );

  return (
    <PageShell title="VPN VLESS" contentClassName="vpn-vless flex flex-col gap-6 bg-transparent p-0">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">VLESS keys management</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create, rename, and remove personal VLESS keys. Each entry exposes a ready-to-use connection URL.
            </p>
          </div>
          <Link
            to="/vpn/vless/guide"
            className="inline-flex items-center gap-2 self-start rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-slate-800"
          >
            <span aria-hidden="true">📘</span>
            Setup guide
          </Link>
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">VLESS traffic</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aggregate uplink/downlink counters fetched from the Xray gRPC API for all keys.
              </p>
              {statsError && (
                <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {statsError}
                </div>
              )}
              <div className="grid gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold">Scope:</span> {statsLabel}
                </div>
                <div>
                  <span className="font-semibold">Uplink:</span> {uplinkMB.toFixed(2)} MB
                </div>
                <div>
                  <span className="font-semibold">Downlink:</span> {downlinkMB.toFixed(2)} MB
                </div>
                <div>
                  <span className="font-semibold">Total:</span> {totalGB.toFixed(2)} GB
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {statsLoading ? "Loading…" : lastUpdated ? lastUpdated.toLocaleString() : "—"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSyncStats}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span aria-hidden="true">⟳</span>
                  {syncing ? "Syncing..." : "Sync now"}
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 p-1 text-xs font-medium text-gray-600 dark:border-gray-600 dark:text-gray-200">
                  <button
                    type="button"
                    onClick={() => handleRangeChange(7)}
                    className={`rounded-full px-3 py-1 transition ${
                      historyRange === 7 ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRangeChange(30)}
                    className={`rounded-full px-3 py-1 transition ${
                      historyRange === 30
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    30 days
                  </button>
                </div>
              </div>
            </div>
            <div className="h-64 w-full max-w-xl">
              {historyLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  Loading history…
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="uplink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="downlink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.max(Math.floor(chartData.length / 6), 0)} />
                    <YAxis tick={{ fontSize: 11 }} width={50} />
                    <Tooltip content={<StatsTooltip />} />
                    <Area type="monotone" dataKey="uplinkMB" name="Uplink" stroke="#6366f1" fill="url(#uplink)" strokeWidth={2} />
                    <Area type="monotone" dataKey="downlinkMB" name="Downlink" stroke="#22c55e" fill="url(#downlink)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No history captured yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreating((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">＋</span>
              New key
            </button>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-slate-800"
            >
              <span aria-hidden="true">⟳</span>
              Refresh
            </button>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "Loading keys..." : `${keys.length} keys`}
          </div>
        </div>

        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="mt-4 grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10"
          >
            <div className="grid gap-1">
              <label className="text-xs font-medium uppercase text-indigo-700 dark:text-indigo-200" htmlFor="vless-name">
                Name
              </label>
              <input
                id="vless-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Device name"
                className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/20 dark:bg-slate-900 dark:text-gray-100"
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium uppercase text-indigo-700 dark:text-indigo-200" htmlFor="vless-comment">
                Comment
              </label>
              <input
                id="vless-comment"
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Optional description"
                className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/20 dark:bg-slate-900 dark:text-gray-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              >
                Create key
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName("");
                  setNewComment("");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {copyHint && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {copyHint}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50/80 dark:bg-slate-900/60">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  UUID
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Comment
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Traffic
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/60 dark:divide-gray-700 dark:bg-slate-900/40">
              {keys.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No keys yet.
                  </td>
                </tr>
              ) : (
                keys.map((key) => {
                  const statsJson = key.stats_json || {};
                  const bytesUp = formatBytes(statsJson.bytes_up);
                  const bytesDown = formatBytes(statsJson.bytes_down);
                  const isEditing = editingId === key.id;
                  return (
                    <tr key={key.id}>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-gray-100"
                          />
                        ) : (
                          <div className="font-medium text-gray-900 dark:text-gray-100">{key.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <code className="break-all rounded-lg bg-slate-900/90 px-2 py-1 text-xs text-emerald-200 dark:bg-slate-800">
                            {key.uuid}
                          </code>
                          {key.config_url && (
                            <button
                              type="button"
                              onClick={() => handleCopy(key)}
                              className="inline-flex items-center gap-1 self-start rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:border-emerald-400/50 dark:hover:bg-emerald-500/10"
                            >
                              Copy link
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <textarea
                            value={editingComment}
                            onChange={(event) => setEditingComment(event.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-gray-100"
                          />
                        ) : (
                          <div className="max-w-xs text-sm text-gray-600 dark:text-gray-400">{key.comment || "—"}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-600 dark:text-gray-400">
                        <div>Up: {bytesUp}</div>
                        <div>Down: {bytesDown}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <form onSubmit={handleEditSubmit} className="flex flex-wrap justify-end gap-2">
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(key)}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(key)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 dark:border-red-500/50 dark:text-red-300 dark:hover:border-red-400/70 dark:hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
