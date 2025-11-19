import React from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartWrapper from "../../../components/ChartWrapper.tsx";

export default function SkillRadar({ data = [], loading = false }) {
  const formatted = data.map((entry) => ({
    category: entry.category,
    value: Number(entry.value) || 0,
  }));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Навыки</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Статистика по категориям</p>
        </div>
      </div>
      <div className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="inline-block h-60 w-full animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        ) : formatted.length ? (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
              <RadarChart data={formatted}>
                <PolarGrid strokeDasharray="4 4" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}`} cursor={{ strokeDasharray: "3 3" }} />
                <Radar name="Уровень" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Нет данных
          </div>
        )}
      </div>
    </div>
  );
}
