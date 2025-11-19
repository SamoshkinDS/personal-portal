import React from "react";

export default function KnowledgeFilters({ filters, onChange, loading }) {
  const [search, setSearch] = React.useState(filters.search || "");
  const [debounced, setDebounced] = React.useState(search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: debounced });
    }, 400);
    return () => clearTimeout(timer);
  }, [debounced]);

  const handleCategory = (event) => {
    onChange({ ...filters, category: event.target.value });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Фильтры</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Поиск и категория</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              search: "",
              category: "",
            })
          }
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
        >
          Сбросить
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setDebounced(event.target.value);
          }}
          placeholder="По названию"
          disabled={loading}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
        />
        <input
          type="text"
          value={filters.category || ""}
          onChange={handleCategory}
          placeholder="Категория"
          disabled={loading}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
        />
      </div>
    </div>
  );
}
