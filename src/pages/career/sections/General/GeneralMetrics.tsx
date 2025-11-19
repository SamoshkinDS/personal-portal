import React from "react";

const METRIC_GRID = [
  { key: "skills_count", label: "Всего навыков" },
  { key: "avg_skill_level", label: "Средний уровень" },
  { key: "courses_completed", label: "Завершённых курсов" },
  { key: "projects_year", label: "Проектов за год" },
  { key: "offers_received", label: "Полученных офферов" },
  { key: "avg_salary", label: "Средняя ЗП" },
];

export default function GeneralMetrics({ metrics }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {METRIC_GRID.map((metric) => (
        <div
          key={metric.key}
          className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70"
        >
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {metric.label}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {metric.key === "avg_salary" ? `${metrics?.[metric.key] || 0} ₽` : metrics?.[metric.key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}
