import React from "react";

const LEVEL_OPTIONS = [1, 2, 3, 4, 5];

export default function SkillsFilters({
  categories = [],
  filters = {},
  onChange,
  onReset,
  disabled = false,
}) {
  const handleSearchChange = (event) => {
    onChange({ ...filters, search: event.target.value });
  };

  const handleLevelChange = (event) => {
    const value = event.target.value;
    onChange({ ...filters, level: value ? Number(value) : null });
  };

  const toggleCategory = (category) => {
    const current = new Set(filters.categories || []);
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    onChange({ ...filters, categories: Array.from(current) });
  };

  const activeCategories = new Set(filters.categories || []);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Фильтры</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Поиск по названию, категории и уровню</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
        >
          Сбросить
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            По названию
          </label>
          <input
            type="search"
            value={filters.search || ""}
            onChange={handleSearchChange}
            disabled={disabled}
            placeholder="Например, React"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Уровень от
          </label>
          <select
            value={filters.level || ""}
            onChange={handleLevelChange}
            disabled={disabled}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="">Любой</option>
            {LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Категории
        </span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              disabled={disabled}
              className={`rounded-2xl border px-3 py-2 text-left text-sm font-medium transition ${
                activeCategories.has(category)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
