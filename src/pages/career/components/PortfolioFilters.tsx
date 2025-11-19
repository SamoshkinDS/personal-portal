import React from "react";
import clsx from "clsx";

const STATUS_OPTIONS = [
  { key: "active", label: "Активный" },
  { key: "completed", label: "Завершён" },
  { key: "archived", label: "Архив" },
];

const PERIOD_OPTIONS = [
  { months: 0, label: "Все" },
  { months: 3, label: "3 мес" },
  { months: 6, label: "6 мес" },
  { months: 12, label: "12 мес" },
];

export default function PortfolioFilters({ filters, onChange, disabled = false }) {
  const activeStatuses = new Set(filters.statuses || []);

  const toggleStatus = (status) => {
    const next = new Set(activeStatuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onChange({ ...filters, statuses: Array.from(next) });
  };

  const handleSearch = (event) => {
    onChange({ ...filters, search: event.target.value });
  };

  const handlePeriod = (months) => {
    onChange({ ...filters, periodMonths: months });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Фильтры</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Статусы, период и поиск</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ statuses: [], periodMonths: 0, search: "" })}
          disabled={disabled}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
        >
          Сбросить
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Статусы
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => {
            const isActive = activeStatuses.has(status.key);
            return (
              <button
                key={status.key}
                type="button"
                onClick={() => toggleStatus(status.key)}
                disabled={disabled}
                className={clsx(
                  "rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                  isActive
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                )}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Поиск
        </label>
        <input
          type="search"
          value={filters.search || ""}
          onChange={handleSearch}
          disabled={disabled}
          placeholder="Название или компания"
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
        />
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Период обновления
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = filters.periodMonths === option.months;
            return (
              <button
                key={option.months}
                type="button"
                onClick={() => handlePeriod(option.months)}
                disabled={disabled}
                className={clsx(
                  "rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
                  isActive
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
