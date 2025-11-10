import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "../Modal.jsx";
import { plantsApi } from "../../api/plants.js";
import { pestsApi, diseasesApi } from "../../api/care.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

const TABS = [
  { id: "pests", label: "Вредители", icon: "🐛" },
  { id: "diseases", label: "Заболевания", icon: "🧫" },
  { id: "medicines", label: "Рекомендованные лекарства", icon: "💊" },
];

const DANGER_LABELS = {
  low: "Низкий риск",
  medium: "Средний риск",
  high: "Опасно",
};

export default function PlantProblemsSection({ plantId, canManage }) {
  if (!canManage || !plantId) return null;
  return <ProblemsBlock plantId={plantId} />;
}

function ProblemsBlock({ plantId }) {
  const [data, setData] = React.useState({ pests: [], diseases: [], medicines: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("pests");
  const [modalType, setModalType] = React.useState(null);
  const [savingType, setSavingType] = React.useState(null);
  const [removingKey, setRemovingKey] = React.useState(null);

  const loadProblems = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await plantsApi.getProblems(plantId);
      setData(normalizeProblems(res));
    } catch (err) {
      setError(err.message || "Не удалось загрузить связанные проблемы");
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await plantsApi.getProblems(plantId);
        if (!cancelled) setData(normalizeProblems(res));
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить связанные проблемы");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOnce();
    return () => {
      cancelled = true;
    };
  }, [plantId]);

  const handleModalSubmit = React.useCallback(
    async (ids) => {
      if (!ids?.length || !modalType) return;
      try {
        setSavingType(modalType);
        const res =
          modalType === "pests"
            ? await plantsApi.addPests(plantId, ids)
            : await plantsApi.addDiseases(plantId, ids);
        setData(normalizeProblems(res));
        toast.success("Связь сохранена");
        setModalType(null);
      } catch (err) {
        toast.error(err.message || "Не удалось сохранить связь");
      } finally {
        setSavingType(null);
      }
    },
    [modalType, plantId]
  );

  const handleDetach = React.useCallback(
    async (type, targetId) => {
      const key = `${type}:${targetId}`;
      try {
        setRemovingKey(key);
        const res =
          type === "pests"
            ? await plantsApi.removePest(plantId, targetId)
            : await plantsApi.removeDisease(plantId, targetId);
        setData(normalizeProblems(res));
        toast.success("Связь удалена");
      } catch (err) {
        toast.error(err.message || "Не удалось удалить связь");
      } finally {
        setRemovingKey(null);
      }
    },
    [plantId]
  );

  const list = data[activeTab] || [];
  const emptyState = !data.pests.length && !data.diseases.length;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Проблемы</h3>
        <button
          type="button"
          onClick={loadProblems}
          className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
        >
          Обновить
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold">
              {data[tab.id]?.length || 0}
            </span>
          </button>
        ))}
        {activeTab !== "medicines" && (
          <button
            type="button"
            onClick={() => setModalType(activeTab)}
            className="ml-auto rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-white/20 dark:text-slate-200"
          >
            Добавить
          </button>
        )}
      </div>
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : emptyState ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
          Для этого растения пока не зафиксированы вредители или болезни
        </div>
      ) : activeTab === "medicines" ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-300">
          Список лекарств формируется автоматически на этапе 3.3 на основе привязанных вредителей и заболеваний.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((item) => (
            <ProblemCard
              key={item.id}
              type={activeTab}
              item={item}
              onRemove={handleDetach}
              removingKey={removingKey}
            />
          ))}
        </div>
      )}
      <ProblemsSelectModal
        type={modalType}
        open={Boolean(modalType)}
        onClose={() => setModalType(null)}
        existingIds={new Set((data[modalType] || []).map((entry) => entry.id))}
        onSubmit={handleModalSubmit}
        submitting={Boolean(savingType)}
      />
    </section>
  );
}

function ProblemCard({ item, type, onRemove, removingKey }) {
  const href = type === "pests" ? `/pests/${item.slug}` : `/diseases/${item.slug}`;
  const badge =
    type === "pests"
      ? DANGER_LABELS[item.danger_level] || "Опасность неизвестна"
      : item.disease_type || "Тип не указан";

  return (
    <div
      className="relative flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 dark:border-white/10 dark:bg-slate-900/40"
      title={item.symptoms || item.description || ""}
    >
      <Link to={href} className="text-base font-semibold text-slate-900 hover:text-blue-600 dark:text-white">
        {item.name}
      </Link>
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
          type === "pests"
            ? dangerClass(item.danger_level)
            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
        }`}
      >
        {badge}
      </span>
      <p className="text-xs text-slate-500 dark:text-slate-300">
        {(item.symptoms || item.description || "Нет описания").slice(0, 120)}
        {(item.symptoms || item.description || "").length > 120 ? "…" : ""}
      </p>
      {type !== "medicines" && (
        <button
          type="button"
          onClick={() => onRemove(type, item.id)}
          className="absolute right-2 top-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 transition hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300"
          disabled={removingKey === `${type}:${item.id}`}
        >
          {removingKey === `${type}:${item.id}` ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />
          ) : (
            "Убрать"
          )}
        </button>
      )}
    </div>
  );
}

function ProblemsSelectModal({ type, open, onClose, existingIds, onSubmit, submitting }) {
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 300);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(new Set());

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQuery("");
  }, [open, type]);

  React.useEffect(() => {
    if (!open || !type) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = type === "pests" ? pestsApi : diseasesApi;
        const res = await api.list({ query: debounced, limit: 50, offset: 0 });
        if (!cancelled) setItems(res.items || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить каталог");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, type, debounced]);

  const toggleItem = (id) => {
    if (existingIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!selected.size) return;
    onSubmit(Array.from(selected));
  };

  const label = type === "pests" ? "вредителей" : "заболевания";

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} title={`Добавить ${label}`} maxWidth="max-w-3xl">
      {!type ? null : (
        <div className="space-y-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по каталогу"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          />
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : (
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                  Ничего не найдено
                </div>
              ) : (
                items.map((item) => {
                  const disabled = existingIds.has(item.id);
                  const checked = selected.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-2 text-sm ${
                        disabled
                          ? "border-slate-100 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-slate-800/40"
                          : checked
                          ? "border-blue-400 bg-blue-50 dark:border-blue-400/40 dark:bg-blue-500/10"
                          : "border-slate-200 hover:border-blue-200 dark:border-white/10"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                        {item.symptoms && (
                          <p className="text-xs text-slate-500 dark:text-slate-300">{item.symptoms}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked || disabled}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4"
                      />
                    </label>
                  );
                })
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selected.size === 0}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Сохранение..." : "Добавить выбранные"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function normalizeProblems(payload) {
  return {
    pests: Array.isArray(payload?.pests) ? payload.pests : [],
    diseases: Array.isArray(payload?.diseases) ? payload.diseases : [],
    medicines: Array.isArray(payload?.medicines) ? payload.medicines : [],
  };
}

function dangerClass(level) {
  switch (level) {
    case "low":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "high":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
  }
}
