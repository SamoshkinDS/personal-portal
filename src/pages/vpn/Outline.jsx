// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import useOutlineKeys from "../../hooks/useOutlineKeys.js";
import { useAuth } from "../../context/AuthContext.jsx";

const UNITS = ["Б", "КБ", "МБ", "ГБ", "ТБ"];

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 Б";
  let v = value;
  let unit = 0;
  while (v >= 1024 && unit < UNITS.length - 1) {
    v /= 1024;
    unit += 1;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${UNITS[unit]}`;
}

export default function Outline() {
  const { user } = useAuth();
  const {
    keys,
    loading,
    error,
    reload,
    createKey,
    deleteKey,
    renameKey,
    metrics,
    server,
    setKeyLimit,
    clearKeyLimit,
    setGlobalLimit,
    clearGlobalLimit,
  } = useOutlineKeys();

  const [name, setName] = React.useState("");
  const [globalLimitGb, setGlobalLimitGb] = React.useState("");
  const [activeActions, setActiveActions] = React.useState(null);
  const [copyModal, setCopyModal] = React.useState(null);

  const menuRefs = React.useRef({});

  React.useEffect(() => {
    const handleClick = (e) => {
      if (!activeActions) return;
      const el = menuRefs.current[activeActions];
      if (el && !el.contains(e.target)) {
        setActiveActions(null);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [activeActions]);

  const canCreate =
    user?.role === "ALL" || !!user?.vpnCanCreate || (user?.permissions || []).includes("vpn_create");

  const handleCreate = async () => {
    const value = name.trim();
    const ok = await createKey(value || undefined);
    if (ok) setName("");
  };

  const handleCopy = async (key) => {
    if (!key.accessUrl) return;
    try {
      await navigator.clipboard.writeText(key.accessUrl);
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
    setCopyModal({
      name: key.name || `Ключ #${key.id}`,
      accessUrl: key.accessUrl,
    });
  };

  const handleRename = async (id, currentName) => {
    const next = window.prompt("Новое имя ключа", currentName || "");
    if (next === null) return;
    const value = next.trim();
    if (!value) return;
    await renameKey(id, value);
  };

  const handleKeyLimit = async (id) => {
    const input = window.prompt("Лимит в ГБ", "5");
    if (input === null) return;
    const gb = Number(input);
    if (!Number.isFinite(gb) || gb < 0) return;
    await setKeyLimit(id, gb * 1024 * 1024 * 1024);
  };

  const handleGlobalLimit = async () => {
    const gb = Number(globalLimitGb);
    if (!Number.isFinite(gb) || gb < 0) return;
    const ok = await setGlobalLimit(gb * 1024 * 1024 * 1024);
    if (ok) setGlobalLimitGb("");
  };

  return (
    <>
      <PageShell title="VPN Outline" contentClassName="vpn-outline flex flex-col gap-6 bg-transparent p-0">
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Управление ключами доступа</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Работайте с API Outline: создавайте ключи, контролируйте лимиты и следите за потреблением трафика.
              </p>
            </div>
            <Link
              to="/vpn/outline/guide"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Инструкция
            </Link>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Название ключа (опционально)"
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={loading || !canCreate}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                Создать
              </button>
              <button
                onClick={reload}
                disabled={loading}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Обновить
              </button>
            </div>
          </div>
          {!canCreate && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Создание недоступно. Выдайте пользователю право <code className="rounded bg-gray-100 px-1 py-0.5">vpn_create</code> или включите флаг VPN create.
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Глобальный лимит для ключей</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Текущий лимит:{" "}
            {server?.accessKeyDataLimit?.bytes ? formatBytes(server.accessKeyDataLimit.bytes) : "не установлен"}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={globalLimitGb}
              onChange={(event) => setGlobalLimitGb(event.target.value)}
              placeholder="Лимит, ГБ (например 5)"
              className="w-full max-w-[220px] rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleGlobalLimit}
                disabled={loading}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                Задать
              </button>
              <button
                onClick={clearGlobalLimit}
                disabled={loading}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Снять лимит
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Загружаем ключи Outline…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ключей пока нет. Создайте первый, чтобы начать.</p>
          ) : (
            <ul className="space-y-4">
              {keys.map((key) => {
                const trafficBytes = metrics?.bytesTransferredByUserId
                  ? metrics.bytesTransferredByUserId[String(key.id)] || 0
                  : 0;
                return (
                  <li
                    key={key.id}
                    className="relative rounded-3xl border border-gray-100 bg-white/95 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900/95"
                  >
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-blue-400 via-indigo-500 to-purple-500" />
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
                      <div className="ml-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {key.name || `Ключ #${key.id}`}
                          </h4>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
                          Трафик {formatBytes(trafficBytes)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {key.accessUrl && (
                          <button
                            type="button"
                            onClick={() => handleCopy(key)}
                            className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-200 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-500/10"
                          >
                            Копировать
                          </button>
                        )}
                        <div
                          className="relative"
                          ref={(node) => {
                            if (node) menuRefs.current[key.id] = node;
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveActions((prev) => (prev === key.id ? null : key.id))}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-slate-800"
                          >
                            Действия
                            <span aria-hidden="true">▾</span>
                          </button>
                          {activeActions === key.id && (
                            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActions(null);
                                  handleRename(key.id, key.name);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-700"
                              >
                                ✏️ Переименовать
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActions(null);
                                  handleKeyLimit(key.id);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-700"
                              >
                                🎯 Лимит на ключ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActions(null);
                                  clearKeyLimit(key.id);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-700"
                              >
                                ♻️ Снять лимит
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActions(null);
                                  deleteKey(key.id);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                🗑️ Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </PageShell>

      <Modal
        open={!!copyModal}
        onClose={() => setCopyModal(null)}
        title={copyModal ? `Доступ для: ${copyModal.name}` : ""}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ссылка доступа скопирована в буфер обмена. При необходимости можно скопировать вручную:
          </p>
          <pre className="custom-scrollbar max-h-48 overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs text-emerald-300">
            {copyModal?.accessUrl}
          </pre>
          <button
            type="button"
            onClick={() => {
              if (copyModal?.accessUrl) navigator.clipboard.writeText(copyModal.accessUrl);
            }}
            className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
          >
            Повторно скопировать
          </button>
        </div>
      </Modal>
    </>
  );
}
