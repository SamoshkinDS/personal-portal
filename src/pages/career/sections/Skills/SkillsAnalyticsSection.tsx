import React from "react";
import { Line, LineChart, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from "recharts";
import ChartWrapper from "../../../../components/ChartWrapper.tsx";

export default function SkillsAnalyticsSection({ data }) {
  const heatmap = data?.heatmap || {};
  const levels = [1, 2, 3, 4, 5];
  const categories = Object.keys(heatmap);
  const timeline = data?.timeline || [];
  const growth = data?.growth || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Навыки</h3>
      </div>
      <div className="mt-4 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Heatmap по категориям
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr>
                  <th className="px-2 py-1"></th>
                  {levels.map((level) => (
                    <th key={level} className="px-2 py-1 text-center">
                      Уровень {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category}>
                    <td className="border-t px-2 py-1 font-semibold text-slate-800 dark:text-white">{category}</td>
                    {levels.map((level) => (
                      <td key={`${category}-${level}`} className="border-t px-2 py-1 text-center text-slate-600 dark:text-slate-300">
                        {heatmap[category]?.[level] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="h-48">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Динамика среднего уровня
          </div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
                <XAxis dataKey="month" />
                <Tooltip />
                <Line type="monotone" dataKey="avg_level" stroke="#2563EB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Top-5 приростов</div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {growth.slice(0, 5).map((entry) => (
              <div key={entry.category} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{entry.category}</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{entry.growth.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
