import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useQueryState } from "../../hooks/useQueryState.js";
import { diseasesApi } from "../../api/care.js";
import CareFiltersModal from "./components/CareFiltersModal.jsx";
import DiseaseFormModal from "./components/DiseaseFormModal.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";

const PAGE_LIMIT = 24;
const TYPE_OPTIONS = ["Грибковое", "Бактериальное", "Вирусное", "Паразитарное", "Физиологическое"];
const FILTER_SECTIONS = [
  {
    key: "type",
    label: "Тип заболевания",
    type: "multi",
    options: TYPE_OPTIONS.map((type) => ({ value: type, label: type })),
  },
  {
    key: "reason",
    label: "Причина",
    type: "text",
    placeholder: "Например, перелив или недостаток света",
  },
];

export default function DiseasesList() {
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

  const typeFilters = React.useMemo(() => parseMulti(queryState.type), [queryState.type]);
  const reasonFilter = React.useMemo(() => (queryState.reason || "").trim(), [queryState.reason]);

  const filterParams = React.useMemo(
    () => ({
      query: debouncedSearch || "",
      type: typeFilters.join(","),
      reason: reasonFilter,
    }),
    [debouncedSearch, reasonFilter, typeFilters]
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
      const data = await diseasesApi.list({ ...filterParams, limit: PAGE_LIMIT, offset: 0 });
      setItems(data.items);
      setTotal(data.total || 0);
      setHasMore(data.items.length < (data.total || 0));
      setNextOffset(data.items.length);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить заболевания");
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
      const data = await diseasesApi.list({ ...filterParams, limit: PAGE_LIMIT, offset: nextOffset });
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
        if (entries[0]?.isIntersecting) loadMore();
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const openCreate = () => setFormState({ open: true, mode: "create", data: null });
  const openEdit = (item) => setFormState({ open: true, mode: "edit", data: item });
  const closeForm = () => setFormState({ open: false, mode: "create", data: null });

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (formState.mode === "edit" && formState.data?.id) {
        const res = await diseasesApi.update(formState.data.id, payload);
        setItems((prev) => prev.map((item) => (item.id === res.item.id ? res.item : item)));
        toast.success("Заболевание обновлено");
      } else {
        await diseasesApi.create(payload);
        toast.success("Заболевание добавлено");
      }
      closeForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(error.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Удалить «${item.name}»?`)) return;
    setRemovingId(item.id);
    try {
      await diseasesApi.remove(item.id);
      toast.success("Удалено");
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error(error.message || "Не удалось удалить");
    } finally {
      setRemovingId(null);
    }
  };

  const chips = [];
  if (typeFilters.length) chips.push(...typeFilters.map((type) => `Тип: ${type}`));
  if (reasonFilter) chips.push(`Причина: ${reasonFilter}`);

  const handleFiltersApply = (next) => {
    setDrawerOpen(false);
    setQueryState({
      type: next?.type?.length ? next.type.join(",") : undefined,
      reason: next?.reason ? next.reason : undefined,
    });
  };
  const handleFiltersReset = () => {
    setQueryState({ type: undefined, reason: undefined });
  };

  return (
    <PageShell hideBreadcrumbs title="Заболевания" contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: "Заболевания" },
        ]}
      />
      <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-sm dark:border-purple-400/20 dark:from-purple-950/30 dark:to-indigo-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">Каталог</p>
            <h1 className="text-3xl font-bold text-purple-900 dark:text-purple-100">Симптомы и лечение</h1>
            <p className="mt-2 max-w-2xl text-sm text-purple-900/70 dark:text-purple-100/70">
              Подборка болезней комнатных растений с описанием причин, признаков и рекомендациями по лечению.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-500"
            >
              + Добавить
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[260px] flex-1 items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm focus-within:border-purple-300 dark:border-white/10 dark:bg-slate-900/60">
          <svg className="mr-3 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              ? "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-400/40 dark:bg-purple-900/30 dark:text-purple-100"
              : "border-slate-200 bg-white/80 text-slate-600 hover:border-purple-200 hover:text-purple-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          }`}
        >
          Фильтры
          {chips.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 px-1 text-xs font-bold text-white">
              {chips.length}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-100 bg-white/80 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-400/10 dark:text-purple-100">
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
          ? Array.from({ length: 6 }).map((_, idx) => <DiseaseCardSkeleton key={idx} />)
          : items.map((item) => (
              <article
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-purple-100 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-purple-400/20 dark:bg-slate-900/60"
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
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">🦠</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.disease_type && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-100">
                          {item.disease_type}
                        </span>
                      )}
                      {item.reason && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-100">
                          {item.reason}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-auto border-t border-slate-100 bg-purple-50/80 px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:border-white/5 dark:bg-purple-900/20 dark:text-purple-200">
                  <Link to={`/diseases/${item.slug}`} className="transition hover:text-purple-800 dark:hover:text-white">
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
        values={{ type: typeFilters, reason: reasonFilter }}
        onApply={handleFiltersApply}
        onReset={handleFiltersReset}
      />

      <DiseaseFormModal
        open={formState.open}
        onClose={closeForm}
        initialValue={formState.data}
        onSubmit={handleSave}
        loading={saving}
      />
    </PageShell>
  );
}

function DiseaseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-purple-100 bg-white/60 p-4 dark:border-purple-400/20 dark:bg-slate-900/40">
      <div className="flex gap-4">
        <div className="h-24 w-24 rounded-2xl bg-purple-100/60 dark:bg-purple-400/10" />
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
