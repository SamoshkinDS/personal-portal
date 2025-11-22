import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { problemsApi } from "../../api/care.js";
import { Link } from "react-router-dom";

const PAGE_LIMIT = 24;

const TYPE_OPTIONS = [
  { id: "all", label: "Все", icon: "🌿" },
  { id: "pest", label: "Вредители", icon: "🐛" },
  { id: "disease", label: "Заболевания", icon: "🧫" },
  { id: "medicine", label: "Лекарства", icon: "💊" },
];

const CARD_THEMES = {
  pest: "border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-900 dark:border-rose-400/30 dark:from-rose-950/30 dark:to-orange-950/20 dark:text-rose-100",
  disease: "border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-900 dark:border-purple-400/30 dark:from-purple-950/30 dark:to-indigo-950/20 dark:text-purple-100",
  medicine: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900 dark:border-emerald-400/30 dark:from-emerald-950/30 dark:to-teal-950/20 dark:text-emerald-100",
};

export default function ProblemsOverview() {
  const [stats, setStats] = React.useState({ pests: 0, diseases: 0, medicines: 0 });
  const [type, setType] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [onlyLinked, setOnlyLinked] = React.useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextOffset, setNextOffset] = React.useState(0);
  const sentinelRef = React.useRef(null);

  const fetchInitial = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await problemsApi.list({
        type,
        query: debouncedQuery,
        onlyLinked,
        limit: PAGE_LIMIT,
        offset: 0,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || { pests: 0, diseases: 0, medicines: 0 });
      setHasMore((data.items || []).length < (data.total || 0));
      setNextOffset((data.items || []).length);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось загрузить список проблем");
      setItems([]);
      setTotal(0);
      setStats({ pests: 0, diseases: 0, medicines: 0 });
    } finally {
      setLoading(false);
    }
  }, [type, debouncedQuery, onlyLinked]);

  React.useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await problemsApi.list({
        type,
        query: debouncedQuery,
        onlyLinked,
        limit: PAGE_LIMIT,
        offset: nextOffset,
      });
      setItems((prev) => [...prev, ...(data.items || [])]);
      const newOffset = nextOffset + (data.items || []).length;
      setNextOffset(newOffset);
      setHasMore(newOffset < (data.total || 0));
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось загрузить данные");
    } finally {
      setLoadingMore(false);
    }
  }, [type, debouncedQuery, onlyLinked, nextOffset, loading, loadingMore, hasMore]);

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

  const skeletons = React.useMemo(() => Array.from({ length: 6 }), []);

  return (
    <PageShell hideBreadcrumbs title="Проблемы и решения" contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: "Проблемы и решения" },
        ]}
      />
      <header className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Общий каталог</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Проблемы растений и решения</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Сводный справочник вредителей, заболеваний и препаратов. Используйте фильтры, чтобы быстро найти риски для растения и подходящие меры.
            </p>
          </div>
        </div>
        <StatsPanel stats={stats} activeType={type} onChangeType={setType} />
      </header>

      <FiltersBar
        query={query}
        onQueryChange={setQuery}
        type={type}
        onTypeChange={setType}
        onlyLinked={onlyLinked}
        onToggleLinked={() => setOnlyLinked((prev) => !prev)}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? skeletons.map((_, idx) => <ProblemCardSkeleton key={idx} />)
          : items.map((item) => <ProblemCard key={`${item.type}:${item.id}`} item={item} />)}
      </section>

      {loadingMore && <div className="text-center text-sm text-slate-500 dark:text-slate-300">Загрузка…</div>}
      <div ref={sentinelRef} />
      {!loading && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-white/20 dark:bg-slate-900/40 dark:text-slate-300">
          Ничего не найдено. Попробуйте изменить фильтры или поиск.
        </div>
      )}
    </PageShell>
  );
}

function FiltersBar({ query, onQueryChange, type, onTypeChange, onlyLinked, onToggleLinked }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="flex min-w-[260px] flex-1 items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 shadow-sm focus-within:border-blue-300 dark:border-white/10 dark:bg-slate-900/60">
          <svg className="mr-3 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Поиск по названию"
            className="w-full bg-transparent text-sm outline-none dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onTypeChange(option.id)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                type === option.id
                  ? "bg-blue-600 text-white shadow"
                  : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
              }`}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200 dark:hover:text-white">
        <input type="checkbox" checked={onlyLinked} onChange={onToggleLinked} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
        Только связанные с растениями
      </label>
    </div>
  );
}

function StatsPanel({ stats, activeType, onChangeType }) {
  const cards = [
    { id: "pest", label: "Вредителей", value: stats?.pests ?? 0, theme: CARD_THEMES.pest },
    { id: "disease", label: "Заболеваний", value: stats?.diseases ?? 0, theme: CARD_THEMES.disease },
    { id: "medicine", label: "Лекарств", value: stats?.medicines ?? 0, theme: CARD_THEMES.medicine },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onChangeType(card.id)}
          className={`flex flex-col gap-1 rounded-3xl border px-5 py-4 text-left transition focus:outline-none ${card.theme} ${
            activeType === card.id ? "ring-2 ring-blue-500/40" : "ring-1 ring-black/0 hover:ring-2 hover:ring-blue-400/30"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">{card.label}</span>
          <span className="text-3xl font-bold">{card.value}</span>
        </button>
      ))}
    </div>
  );
}

function ProblemCard({ item }) {
  const theme = CARD_THEMES[item.type] || "border-slate-100 bg-white/90 text-slate-900";
  const icon = item.type === "pest" ? "🐛" : item.type === "disease" ? "🧫" : "💊";
  const link =
    item.type === "pest" ? `/pests/${item.slug}` : item.type === "disease" ? `/diseases/${item.slug}` : `/medicines/${item.slug}`;
  const subtitle =
    item.type === "pest"
      ? item.danger_level ? dangerLabel(item.danger_level) : "Опасность не указана"
      : item.type === "disease"
      ? item.disease_type || "Тип не указан"
      : item.medicine_type || "Тип препарата";
  const badges = buildBadges(item);

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${theme}`}>
      <span className="absolute right-4 top-4 text-3xl">{icon}</span>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">
          <Link to={link} className="transition hover:text-blue-600 dark:hover:text-white">
            {item.name}
          </Link>
        </h3>
        <span className="inline-flex w-fit rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-white">
          {subtitle}
        </span>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge.label} className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
              {badge.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 text-right text-sm">
        <Link to={link} className="font-semibold text-blue-600 underline-offset-4 transition hover:underline dark:text-blue-200">
          Подробнее →
        </Link>
      </div>
    </article>
  );
}

function buildBadges(item) {
  const result = [];
  if (item?.stats?.plants) {
    result.push({ label: `Связано с ${item.stats.plants} раст.` });
  }
  if (item.type === "pest" || item.type === "disease") {
    if (item?.stats?.medicines) {
      result.push({ label: `Лекарств: ${item.stats.medicines}` });
    }
  }
  if (item.type === "medicine") {
    if (item?.stats?.pests) {
      result.push({ label: `Вредителей: ${item.stats.pests}` });
    }
    if (item?.stats?.diseases) {
      result.push({ label: `Заболеваний: ${item.stats.diseases}` });
    }
  }
  return result;
}

function dangerLabel(level) {
  switch (level) {
    case "high":
      return "Высокий риск";
    case "medium":
      return "Средний риск";
    case "low":
      return "Низкий риск";
    default:
      return "Опасность не указана";
  }
}

function ProblemCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/40">
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

