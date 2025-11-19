import React from "react";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Запланированные" },
  { value: "passed", label: "Успешные" },
  { value: "rejected", label: "Отклонённые" },
  { value: "offer_received", label: "Получено офферов" },
  { value: "offer_declined", label: "Отклонённые офферы" },
];

const TYPE_OPTIONS = [
  { value: "Technical", label: "Техническое" },
  { value: "HR", label: "HR" },
  { value: "Final", label: "Финальное" },
  { value: "Test Assignment", label: "Тестовое задание" },
];

const MODE_OPTIONS = [
  { key: "all", label: "Все" },
  { key: "upcoming", label: "Предстоящие" },
  { key: "past", label: "Прошедшие" },
];

export default function InterviewsFiltersRu({ filters, onChange, loading }) {
  const toggleStatus = (status) => {
    const current = new Set(filters.statuses || []);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    onChange({ ...filters, statuses: Array.from(current) });
  };

  const handleDateChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const handleCompany = (event) => {
    onChange({ ...filters, company: event.target.value });
  };

  const handleType = (event) => {
    onChange({ ...filters, types: event.target.value ? [event.target.value] : [] });
  };

  const handleMode = (mode) => {
    onChange({ ...filters, mode });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Фильтры собеседований</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Статусы, даты и типы</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              statuses: [],
              dateFrom: "",
              dateTo: "",
              company: "",
              types: [],
              mode: "all",
              sortField: "interview_date",
              sortOrder: "desc",
            })
          }
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:hover:text-white"
        >
          Сбросить
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => {
          const active = (filters.statuses || []).includes(status.value);
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => toggleStatus(status.value)}
              disabled={loading}
              className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Дата от/до
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(event) => handleDateChange("dateFrom", event.target.value)}
              disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
            <input
              type="date"
              value={filters.dateTo || ""}
              onChange={(event) => handleDateChange("dateTo", event.target.value)}
              disabled={loading}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Компания
          </label>
          <input
            type="text"
            value={filters.company || ""}
            onChange={handleCompany}
            disabled={loading}
            placeholder="Например, Google"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Тип интервью
          </label>
          <select
            value={filters.types?.[0] || ""}
            onChange={handleType}
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <option value="">Любой</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Показывать
          </label>
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleMode(option.key)}
                disabled={loading}
                className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  filters.mode === option.key
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
