// encoding: utf-8
import React from "react";

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(Number(value));
}

export default function KPICard({ title, value, currency = "₽", hint, trend }) {
  const formatted = `${formatValue(value)} ${currency}`.trim();
  const trendColor =
    trend && trend.value !== undefined
      ? trend.value >= 0
        ? "text-emerald-500"
        : "text-rose-500"
      : "text-slate-500";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-white/5 dark:bg-slate-900/70">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {formatted}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{hint}</span>
        {trend && trend.value !== undefined && (
          <span className={`inline-flex items-center gap-1 ${trendColor}`}>
            {trend.value >= 0 ? "↑" : "↓"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
