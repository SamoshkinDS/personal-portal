import React from "react";

const STATUS_OPTIONS = [
  { key: "planned", label: "Запланированные" },
  { key: "in_progress", label: "В процессе" },
  { key: "completed", label: "Завершённые" },
  { key: "abandoned", label: "Отказ" },
];

export default function CoursesFilters({ filters, platforms, onChange, disabled }) {
  const toggleStatus = (status) => {
    const current = new Set(filters.statuses || []);
    if (current.has(status)) current.delete(status);
    else current.add(status);
    onChange({ ...filters, statuses: Array.from(current) });
  };

  const handleField = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => {
          const active = (filters.statuses || []).includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => toggleStatus(option.key)}
              disabled={disabled}
              className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Платформа
          <select
            value={filters.platform || ""}
            onChange={(event) => handleField("platform", event.target.value)}
            disabled={disabled}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="">Все платформы</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          За период
          <select
            value={filters.periodMonths}
            onChange={(event) => handleField("periodMonths", Number(event.target.value))}
            disabled={disabled}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value={0}>За всё время</option>
            <option value={3}>3 месяца</option>
            <option value={6}>6 месяцев</option>
            <option value={12}>12 месяцев</option>
          </select>
        </label>
      </div>

      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Поиск
        <input
          type="text"
          value={filters.search || ""}
          onChange={(event) => handleField("search", event.target.value)}
          disabled={disabled}
          placeholder="Название или платформа"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
        />
      </label>
    </div>
  );
}
