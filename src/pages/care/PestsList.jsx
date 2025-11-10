import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useQueryState } from "../../hooks/useQueryState.js";
import { pestsApi } from "../../api/care.js";
import CareFiltersModal from "./components/CareFiltersModal.jsx";
import PestFormModal from "./components/PestFormModal.jsx";

const PAGE_LIMIT = 24;
const DANGER_BADGES = {
  low: { label: "Низкий риск", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100" },
  medium: { label: "Средний риск", className: "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-100" },
  high: { label: "Высокий риск", className: "bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-100" },
};
const FILTER_SECTIONS = [
  {
    key: "danger",
    label: "Опасность",
    type: "multi",
    options: [
      { value: "low", label: "Низкая", activeClass: "bg-emerald-500 text-white" },
      { value: "medium", label: "Средняя", activeClass: "bg-amber-500 text-white" },
      { value: "high", label: "Высокая", activeClass: "bg-rose-500 text-white" },
    ],
  },
  {
    key: "active",
    label: "Период активности",
    type: "multi",
    description: "Можно выбрать несколько сезонов",
    options: [
      { value: "весна", label: "Весна" },
      { value: "лето", label: "Лето" },
      { value: "осень", label: "Осень" },
      { value: "зима", label: "Зима" },
    ],
  },
];

export default function PestsList() {
  const { user } = useAuth();
  const canManage =
    user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [queryState, setQueryState] = useQueryState({});
  const [searchValue, setSearchValue] = React.useState(queryState.query || "");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  React.useEffect(() => {
    if ((queryState.query || "") === (debouncedSearch || "")) return;
    setQueryState({ query: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const dangerFilters = React.useMemo(() => parseMulti(queryState.danger), [queryState.danger]);
  const activeFilters = React.useMemo(() => parseMulti(queryState.active), [queryState.active]);

  const filterParams = React.useMemo(
    () => ({
      query: debouncedSearch || "",
      danger: dangerFilters.join(","),
      active: activeFilters.join(","),
    }),
    [debouncedSearch, dangerFilters, activeFilters]
  );

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextOffset, setNextOffset] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);
  const sentinelRef = React.useRef(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [formState, setFormState] = React.useState({ open: false, mode: "create", data: null });
  const [saving, setSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState(null);

  const loadInitial = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await pestsApi.list({ ...filterParams, limit: PAGE_LIMIT, offset: 0 });
      setItems(data.items);
      setTotal(data.total || 0);
      setHasMore(data.items.length < (data.total || 0));
      setNextOffset(data.items.length);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить вредителей");
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  React.useEffect(() => {
    loadInitial();
  }, [loadInitial, reloadKey]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await pestsApi.list({ ...filterParams, limit: PAGE_LIMIT, offset: nextOffset });
      setItems((prev) => [...prev, ...data.items]);
      const newOffset = nextOffset + data.items.length;
      setNextOffset(newOffset);
      setHasMore(newOffset < (data.total || 0));
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить ещё");
    } finally {
      setLoadingMore(false);
    }
  }, [filterParams, hasMore, loading, loadingMore, nextOffset]);

  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleFiltersApply = (nextValues) => {
    setDrawerOpen(false);
    setQueryState({
      danger: nextValues?.danger?.length ? nextValues.danger.join(",") : undefined,
      active: nextValues?.active?.length ? nextValues.active.join(",") : undefined,
    });
  };

  const handleFiltersReset = () => {
    setQueryState({ danger: undefined, active: undefined });
  };

  const openCreate = () => setFormState({ open: true, mode: "create", data: null });
  const openEdit = (item) => setFormState({ open: true, mode: "edit", data: item });
  const closeForm = () => setFormState({ open: false, mode: "create", data: null });

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (formState.mode === "edit" && formState.data?.id) {
        const res = await pestsApi.update(formState.data.id, payload);
        toast.success("Данные обновлены");
        setItems((prev) => prev.map((item) => (item.id === res.item.id ? res.item : item)));
      } else {
        await pestsApi.create(payload);
        toast.success("Вредитель создан");
      }
      closeForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error.message || "Не удалось сохранить данные");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Удалить «${item.name}»?`)) return;
    setRemovingId(item.id);
    try {
      await pestsApi.remove(item.id);
      toast.success("Удалено");
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error(error.message || "Не удалось удалить запись");
    } finally {
      setRemovingId(null);
    }
  };

  const chips = getFilterChips({ danger: dangerFilters, active: activeFilters });

  return (
    <PageShell title="Вредители" contentClassName="flex flex-col gap-6">
      <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-6 shadow-sm dark:border-rose-400/20 dark:from-rose-950/30 dark:to-orange-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Каталог</p>
            <h1 className="text-3xl font-bold text-rose-900 dark:text-rose-100">Опасные гости</h1>
            <p className="mt-2 max-w-2xl text-sm text-rose-700/80 dark:text-rose-100/70">
              Справочник по вредителям комнатных растений. Отслеживайте сезоны активности, симптомы и способы борьбы.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-500"
            >
              + Добавить
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[260px] flex-1 items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm focus-within:border-rose-300 dark:border-white/10 dark:bg-slate-900/60">
          <svg
            className="mr-3 h-5 w-5 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Поиск по названию или описанию"
            className="w-full bg-transparent text-sm outline-none dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            chips.length
              ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/40 dark:bg-rose-900/30 dark:text-rose-100"
              : "border-slate-200 bg-white/80 text-slate-600 hover:border-rose-200 hover:text-rose-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          }`}
        >
          Фильтры
          {chips.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
              {chips.length}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-100 bg-white/80 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-400/10 dark:text-rose-100">
              {chip}
            </span>
          ))}
          <button
            type="button"
            onClick={handleFiltersReset}
            className="text-xs font-semibold text-slate-500 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Сбросить
          </button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => <PestCardSkeleton key={idx} />)
          : items.map((item) => (
              <article
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-rose-400/20 dark:bg-slate-900/60"
              >
                {canManage && (
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-full bg-white/80 p-2 text-xs text-slate-500 shadow dark:bg-slate-900/80"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={removingId === item.id}
                      className="rounded-full bg-white/80 p-2 text-xs text-rose-500 shadow hover:text-rose-700 disabled:opacity-60 dark:bg-slate-900/80"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                <div className="flex gap-4 p-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">🐛</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.danger_level && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DANGER_BADGES[item.danger_level]?.className || "bg-slate-100 text-slate-600"}`}>
                          {DANGER_BADGES[item.danger_level]?.label || item.danger_level}
                        </span>
                      )}
                      {item.active_period && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-400/20 dark:text-orange-100">
                          {item.active_period}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
                {item.symptoms && (
                  <p className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">Симптомы: {item.symptoms}</p>
                )}
                <div className="mt-auto border-t border-slate-100 bg-rose-50/80 px-4 py-3 text-right text-sm font-semibold text-rose-600 dark:border-white/5 dark:bg-rose-900/20 dark:text-rose-200">
                  <Link to={`/pests/${item.slug}`} className="transition hover:text-rose-800 dark:hover:text-white">
                    Подробнее →
                  </Link>
                </div>
              </article>
            ))}
      </section>

      {loadingMore && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">Загрузка...</div>
      )}
      <div ref={sentinelRef} />

      <CareFiltersModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sections={FILTER_SECTIONS}
        values={{ danger: dangerFilters, active: activeFilters }}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
      />

      <PestFormModal
        open={formState.open}
        onClose={closeForm}
        initialValue={formState.data}
        onSubmit={handleSave}
        loading={saving}
      />
    </PageShell>
  );
}

function PestCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-rose-100 bg-white/60 p-4 dark:border-rose-400/20 dark:bg-slate-900/40">
      <div className="flex gap-4">
        <div className="h-24 w-24 rounded-2xl bg-rose-100/60 dark:bg-rose-400/10" />
        <div className="flex-1 space-y-3">
          <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

function parseMulti(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function getFilterChips(filters) {
  const chips = [];
  if (filters.danger?.length) {
    chips.push(...filters.danger.map((danger) => `Опасность: ${DANGER_BADGES[danger]?.label || danger}`));
  }
  if (filters.active?.length) {
    chips.push(...filters.active.map((period) => `Сезон: ${period}`));
  }
  return chips;
}
