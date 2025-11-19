import React from "react";
import clsx from "clsx";

const METRIC_CONFIG = [
  { key: "skills", label: "Навыков освоено" },
  { key: "coursesCompleted", label: "Курсов завершено" },
  { key: "portfolioProjects", label: "Проектов в портфолио" },
  { key: "successfulInterviews", label: "Успешных собеседований" },
];

export default function DashboardMetrics({ metrics = {}, loading = false }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {METRIC_CONFIG.map((metric) => {
        const value = metrics?.[metric.key] ?? 0;
        return (
          <div
            key={metric.key}
            className={clsx(
              "rounded-3xl border border-white/10 bg-white/90 px-5 py-6 shadow transition dark:border-white/5 dark:bg-slate-900/70",
              loading ? "animate-pulse" : ""
            )}
          >
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">{metric.label}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? (
                <span className="inline-block h-10 w-24 rounded-2xl bg-slate-200/70 dark:bg-slate-700/70" />
              ) : (
                value.toLocaleString("ru-RU")
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
