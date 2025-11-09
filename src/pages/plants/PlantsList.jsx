import React from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { plantsApi } from "../../api/plants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useQueryState } from "../../hooks/useQueryState.js";

const MONTHS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

const TOX_TARGETS = [
  { key: "tox_cat", label: "Кошки" },
  { key: "tox_dog", label: "Собаки" },
  { key: "tox_human", label: "Люди" },
];

const TOX_LEVELS = [
  { value: 1, label: "Низкая" },
  { value: 2, label: "Средняя" },
  { value: 3, label: "Высокая" },
];

const DEFAULT_FILTERS = {
  query: "",
  sort: "alpha_ru",
  light: [],
  watering: [],
  soil: [],
  humidity: [],
  temperature: [],
  location: [],
  tags: [],
  bloom: [],
  tox_cat: [],
  tox_dog: [],
  tox_human: [],
  family: "",
  origin: "",
};

export default function PlantsList() {
  const { user } = useAuth();
  const canManage =
    user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [queryState, setQueryState] = useQueryState({ sort: "alpha_ru" });
  const [searchValue, setSearchValue] = React.useState(queryState.query || "");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const [meta, setMeta] = React.useState(null);
  const [metaLoading, setMetaLoading] = React.useState(true);

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextOffset, setNextOffset] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const filterState = React.useMemo(() => parseFilters(queryState), [queryState]);
  const pageLimit = meta?.config?.pageLimit || 24;
  const requestSignature = React.useMemo(
    () => JSON.stringify({ ...filterState, limit: pageLimit, reloadKey }),
    [filterState, pageLimit, reloadKey]
  );

  const hasActiveFilters = React.useMemo(
    () =>
      filterState.query ||
      filterState.family ||
      filterState.origin ||
      Object.entries(filterState).some(
        ([key, value]) =>
          Array.isArray(value) &&
          value.length > 0 &&
          !["tags"].includes(key)
      ) ||
      filterState.tags.length > 0,
    [filterState]
  );

  React.useEffect(() => {
    let isMounted = true;
    const loadMeta = async () => {
      try {
        setMetaLoading(true);
        const data = await plantsApi.meta();
        if (!isMounted) return;
        setMeta(data);
      } catch (error) {
        toast.error(error.message || "Не удалось загрузить справочники");
      } finally {
        if (isMounted) setMetaLoading(false);
      }
    };
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const normalized = debouncedSearch || "";
    if (normalized === (filterState.query || "")) return;
    setQueryState({ query: normalized || undefined });
  }, [debouncedSearch, filterState.query, setQueryState]);

  React.useEffect(() => {
    const current = queryState.query || "";
    setSearchValue((prev) => (prev === current ? prev : current));
  }, [queryState.query]);

  React.useEffect(() => {
    let isCancelled = false;
    async function loadInitial() {
      try {
        setLoading(true);
        setItems([]);
        const data = await plantsApi.list({
          ...filtersToParams(filterState),
          limit: pageLimit,
          offset: 0,
        });
        if (isCancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        const receivedOffset = data.offset ?? 0;
        const newOffset = receivedOffset + (data.items?.length || 0);
        setNextOffset(newOffset);
        setHasMore(newOffset < (data.total || 0));
      } catch (error) {
        if (!isCancelled) {
          toast.error(error.message || "Не удалось загрузить каталог");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [pageLimit, filterState.sort, requestSignature]);

  const loadMore = React.useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const data = await plantsApi.list({
        ...filtersToParams(filterState),
        limit: pageLimit,
        offset: nextOffset,
      });
      setItems((prev) => [...prev, ...(data.items || [])]);
      const receivedOffset = data.offset ?? nextOffset;
      const newOffset = receivedOffset + (data.items?.length || 0);
      setNextOffset(newOffset);
      setHasMore(newOffset < (data.total || total));
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить больше растений");
    } finally {
      setLoadingMore(false);
    }
  }, [filterState, hasMore, loading, loadingMore, nextOffset, pageLimit, total]);

  const sentinelRef = React.useRef(null);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const dictMaps = React.useMemo(() => buildDictMaps(meta), [meta]);
  const chips = React.useMemo(
    () => buildFilterChips(filterState, dictMaps),
    [filterState, dictMaps]
  );

  const [drawerFilters, setDrawerFilters] = React.useState(filterState);
  React.useEffect(() => {
    if (!drawerOpen) {
      setDrawerFilters(filterState);
    }
  }, [filterState, drawerOpen]);

  const applyDrawerFilters = React.useCallback(() => {
    setQueryState(filtersToQueryPatch(drawerFilters));
    setDrawerOpen(false);
  }, [drawerFilters, setQueryState]);

  const resetAll = () => {
    setSearchValue("");
    setQueryState({
      query: undefined,
      sort: undefined,
      light: undefined,
      watering: undefined,
      soil: undefined,
      humidity: undefined,
      temperature: undefined,
      location: undefined,
      tags: undefined,
      bloom: undefined,
      tox_cat: undefined,
      tox_dog: undefined,
      tox_human: undefined,
      family: undefined,
      origin: undefined,
    });
  };

  const handleSortChange = (sort) => {
    if (sort === filterState.sort) return;
    setQueryState({ sort });
  };

  const handleChipRemove = (key) => {
    setQueryState({ [key]: undefined });
  };

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    toast.success("Растение добавлено");
    setReloadKey((key) => key + 1);
  };

  return (
    <PageShell title="Растения" contentClassName="flex flex-col gap-6">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex min-w-[240px] flex-1 items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm transition focus-within:border-blue-400 dark:border-white/10 dark:bg-slate-900/60">
            <svg
              className="mr-3 h-5 w-5 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Поиск по названию, семейству или происхождению"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              hasActiveFilters
                ? "border-emerald-300 bg-emerald-50/70 text-emerald-600 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-slate-200 bg-white/80 text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16" />
              <path d="M7 12h10" />
              <path d="M10 20h4" />
            </svg>
            Фильтры
          </button>
          <SortSwitch active={filterState.sort} onChange={handleSortChange} />
          {canManage && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-2xl border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-blue-500/20 transition hover:bg-blue-500"
            >
              Добавить
            </button>
          )}
        </div>

        {(chips.length > 0 || hasActiveFilters) && (
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-100 bg-white/70 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleChipRemove(chip.key)}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-100"
                >
                  {chip.label}
                  <span className="text-blue-400">×</span>
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="text-xs font-semibold text-slate-500 underline-offset-4 hover:underline dark:text-slate-300"
              >
                Сбросить всё
              </button>
            )}
          </div>
        )}

        <PlantGrid
          items={items}
          loading={loading}
          loadingMore={loadingMore}
          total={total}
          hasActiveFilters={hasActiveFilters}
          canManage={canManage}
        />
        <div ref={sentinelRef} />
      </div>

      <FiltersDrawer
        open={drawerOpen}
        filters={drawerFilters}
        dicts={meta?.dicts}
        tags={meta?.tags || []}
        loading={metaLoading}
        onClose={() => setDrawerOpen(false)}
        onChange={setDrawerFilters}
        onApply={applyDrawerFilters}
        onReset={() => setDrawerFilters({ ...DEFAULT_FILTERS, query: filterState.query, sort: filterState.sort })}
      />

      <CreatePlantDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreateSuccess} />
    </PageShell>
  );
}

function SortSwitch({ active, onChange }) {
  const options = [
    { value: "alpha_ru", label: "По алфавиту" },
    { value: "created_desc", label: "Новые" },
  ];
  return (
    <div className="flex rounded-2xl border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-xl px-3 py-1 transition ${
            active === option.value
              ? "bg-blue-600 text-white shadow"
              : "hover:text-blue-600 dark:hover:text-blue-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PlantGrid({ items, loading, loadingMore, total, hasActiveFilters, canManage }) {
  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white/70 dark:border-white/10 dark:bg-slate-900/40"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-white/20 dark:bg-slate-900/40 dark:text-slate-300">
        {hasActiveFilters ? (
          <>
            <p className="text-base font-semibold text-slate-700 dark:text-white">Ничего не найдено</p>
            <p className="mt-1">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-slate-700 dark:text-white">Каталог пуст</p>
            <p className="mt-1">Добавьте первое растение, чтобы начать вести коллекцию.</p>
            {canManage && (
              <p className="mt-2 text-xs text-slate-400">Кнопка «Добавить» доступна в правом верхнем углу.</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
      {loadingMore && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">Загрузка...</div>
      )}
      <div className="text-xs text-slate-400 dark:text-slate-500">Всего: {total}</div>
    </>
  );
}

function PlantCard({ plant }) {
  const image = plant.main_preview_url || plant.main_image_url;
  return (
    <Link
      to={`/plants/${plant.slug}`}
      className="group flex h-full flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-white/10 dark:bg-slate-900/60"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        {image ? (
          <img
            src={image}
            alt={plant.common_name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 13c3.5 0 7-2 7-8-4 0-7 2-7 8Z" />
              <path d="M12 13c0-6-3-8-7-8 0 6 3.5 8 7 8Z" />
              <path d="M12 22v-9" />
              <path d="M9 21h6" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-900 transition group-hover:text-blue-600 dark:text-white">
          {plant.common_name}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
          {plant.light && <Badge label="Свет" value={plant.light} />}
          {plant.watering && <Badge label="Полив" value={plant.watering} />}
          <ToxicityBadge toxicity={plant.toxicity} />
        </div>
      </div>
    </Link>
  );
}

function Badge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
      {label}: <span className="text-slate-900 dark:text-white">{value}</span>
    </span>
  );
}

function ToxicityBadge({ toxicity }) {
  if (!toxicity) return null;
  const levels = ["—", "низк.", "сред.", "выс."];
  const hasValue = ["cats", "dogs", "humans"].some((k) => toxicity[k]);
  if (!hasValue) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-100">
      Токсичность:
      <span className="flex gap-2">
        {toxicity.cats !== undefined && (
          <span className="flex items-center gap-1">
            🐈 {levels[toxicity.cats] ?? "—"}
          </span>
        )}
        {toxicity.dogs !== undefined && (
          <span className="flex items-center gap-1">
            🐕 {levels[toxicity.dogs] ?? "—"}
          </span>
        )}
        {toxicity.humans !== undefined && (
          <span className="flex items-center gap-1">
            👤 {levels[toxicity.humans] ?? "—"}
          </span>
        )}
      </span>
    </span>
  );
}
function FiltersDrawer({ open, filters, dicts, tags, loading, onClose, onChange, onApply, onReset }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Фильтры</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Загрузка...</div>
            ) : (
              <div className="space-y-6">
                <FilterMultiSelect
                  title="Свет"
                  options={dicts?.light || []}
                  value={filters.light}
                  onChange={(next) => onChange((prev) => ({ ...prev, light: next }))}
                />
                <FilterMultiSelect
                  title="Полив"
                  options={dicts?.watering || []}
                  value={filters.watering}
                  onChange={(next) => onChange((prev) => ({ ...prev, watering: next }))}
                />
                <FilterMultiSelect
                  title="Почва"
                  options={dicts?.soil || []}
                  value={filters.soil}
                  onChange={(next) => onChange((prev) => ({ ...prev, soil: next }))}
                />
                <FilterMultiSelect
                  title="Влажность"
                  options={dicts?.humidity || []}
                  value={filters.humidity}
                  onChange={(next) => onChange((prev) => ({ ...prev, humidity: next }))}
                />
                <FilterMultiSelect
                  title="Температура"
                  options={dicts?.temperature || []}
                  value={filters.temperature}
                  onChange={(next) => onChange((prev) => ({ ...prev, temperature: next }))}
                />
                <FilterMultiSelect
                  title="Локация"
                  options={dicts?.locations || []}
                  value={filters.location}
                  onChange={(next) => onChange((prev) => ({ ...prev, location: next }))}
                />
                <FilterText
                  title="Семейство"
                  value={filters.family}
                  onChange={(value) => onChange((prev) => ({ ...prev, family: value }))}
                />
                <FilterText
                  title="Происхождение"
                  value={filters.origin}
                  onChange={(value) => onChange((prev) => ({ ...prev, origin: value }))}
                />
                <FilterMonths
                  value={filters.bloom}
                  onChange={(value) => onChange((prev) => ({ ...prev, bloom: value }))}
                />
                <FilterToxicity
                  values={filters}
                  onChange={(target, value) =>
                    onChange((prev) => ({ ...prev, [target]: value }))
                  }
                />
                <FilterTags
                  tags={tags}
                  value={filters.tags}
                  onChange={(next) => onChange((prev) => ({ ...prev, tags: next }))}
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={onApply}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-blue-500/20 transition hover:bg-blue-500"
              >
                Применить
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-200"
              >
                Сбросить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FilterMultiSelect({ title, options, value, onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.id)}
            className={`rounded-2xl border px-3 py-1 text-xs font-semibold transition ${
              value.includes(option.id)
                ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-100"
                : "border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterText({ title, value, onChange }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">{title}</h3>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Введите ${title.toLowerCase()}`}
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
      />
    </section>
  );
}

function FilterMonths({ value, onChange }) {
  const toggle = (month) => {
    if (value.includes(month)) {
      onChange(value.filter((item) => item !== month));
    } else {
      onChange([...value, month]);
    }
  };
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">Цветение</h3>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {MONTHS.map((label, idx) => {
          const month = idx + 1;
          const active = value.includes(month);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(month)}
              className={`rounded-2xl border px-2 py-1 ${
                active
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/10 dark:text-amber-100"
                  : "border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-600 dark:border-white/10 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterToxicity({ values, onChange }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">Токсичность</h3>
      <div className="space-y-3">
        {TOX_TARGETS.map((target) => (
          <div key={target.key}>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{target.label}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {TOX_LEVELS.map((level) => {
                const active = values[target.key]?.includes(level.value);
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? values[target.key].filter((l) => l !== level.value)
                        : [...(values[target.key] || []), level.value];
                      onChange(target.key, next);
                    }}
                    className={`rounded-2xl border px-3 py-1 ${
                      active
                        ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/10 dark:text-rose-100"
                        : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600 dark:border-white/10 dark:text-slate-300"
                    }`}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterTags({ tags, value, onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">Теги</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              value.includes(tag.id)
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
            }`}
          >
            #{tag.name}
          </button>
        ))}
      </div>
    </section>
  );
}
function CreatePlantDialog({ open, onClose, onCreated }) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Введите название растения");
      return;
    }
    try {
      setLoading(true);
      await plantsApi.create({ common_name: name.trim() });
      setName("");
      onCreated();
    } catch (error) {
      toast.error(error.message || "Не удалось создать запись");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить растение">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-200">
          Название
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
            placeholder="Например, Фикус каучуконосный"
          />
        </label>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function parseFilters(query) {
  return {
    ...DEFAULT_FILTERS,
    ...Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined)),
    sort: query.sort || "alpha_ru",
    query: query.query || "",
    light: parseNumberList(query.light),
    watering: parseNumberList(query.watering),
    soil: parseNumberList(query.soil),
    humidity: parseNumberList(query.humidity),
    temperature: parseNumberList(query.temperature),
    location: parseNumberList(query.location),
    tags: parseNumberList(query.tags),
    bloom: parseNumberList(query.bloom),
    tox_cat: parseNumberList(query.tox_cat),
    tox_dog: parseNumberList(query.tox_dog),
    tox_human: parseNumberList(query.tox_human),
    family: query.family || "",
    origin: query.origin || "",
  };
}

function parseNumberList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return list
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
}

function filtersToParams(filters) {
  return {
    query: filters.query || undefined,
    sort: filters.sort,
    light: filters.light,
    watering: filters.watering,
    soil: filters.soil,
    humidity: filters.humidity,
    temperature: filters.temperature,
    location: filters.location,
    tags: filters.tags,
    bloom: filters.bloom,
    tox_cat: filters.tox_cat,
    tox_dog: filters.tox_dog,
    tox_human: filters.tox_human,
    family: filters.family || undefined,
    origin: filters.origin || undefined,
  };
}

function filtersToQueryPatch(filters) {
  const patch = {};
  Object.entries(filtersToParams(filters)).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      patch[key] = undefined;
    } else {
      patch[key] = value;
    }
  });
  return patch;
}

function buildDictMaps(meta) {
  if (!meta) return {};
  const map = {};
  Object.entries(meta.dicts || {}).forEach(([key, values]) => {
    map[key] = {};
    values.forEach((entry) => {
      map[key][entry.id] = entry.name;
    });
  });
  if (meta.tags) {
    map.tags = {};
    meta.tags.forEach((tag) => {
      map.tags[tag.id] = tag.name;
    });
  }
  return map;
}

function buildFilterChips(filters, dictMaps) {
  const chips = [];
  const addChip = (key, label) => {
    chips.push({ key, label });
  };
  const dictFields = ["light", "watering", "soil", "humidity", "temperature", "location"];
  dictFields.forEach((field) => {
    if ((filters[field] || []).length) {
      const names =
        filters[field]
          .map((id) => dictMaps?.[field]?.[id])
          .filter(Boolean)
          .join(", ") || `${filters[field].length} знач.`;
      addChip(field, `${fieldLabel(field)}: ${names}`);
    }
  });
  if (filters.tags.length) {
    const names =
      filters.tags.map((id) => dictMaps?.tags?.[id]).filter(Boolean).join(", ") ||
      `${filters.tags.length} тег(а)`;
    addChip("tags", `Теги: ${names}`);
  }
  if (filters.bloom.length) {
    const names = filters.bloom.map((m) => MONTHS[m - 1]).filter(Boolean).join(", ");
    addChip("bloom", `Цветение: ${names}`);
  }
  TOX_TARGETS.forEach((target) => {
    if ((filters[target.key] || []).length) {
      addChip(target.key, `Токсичность (${target.label})`);
    }
  });
  if (filters.family) addChip("family", `Семейство: ${filters.family}`);
  if (filters.origin) addChip("origin", `Происхождение: ${filters.origin}`);
  return chips;
}

function fieldLabel(field) {
  switch (field) {
    case "light":
      return "Свет";
    case "watering":
      return "Полив";
    case "soil":
      return "Почва";
    case "humidity":
      return "Влажность";
    case "temperature":
      return "Температура";
    case "location":
      return "Локация";
    default:
      return field;
  }
}
