import React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartWrapper from "../../../components/ChartWrapper.tsx";

const STATUS_SEGMENTS = [
  { key: "planned", label: "Запланированы", color: "#a855f7" },
  { key: "inProgress", label: "В процессе", color: "#2563eb" },
  { key: "completed", label: "Завершены", color: "#22c55e" },
  { key: "abandoned", label: "Отказаны", color: "#f97316" },
];

export default function CourseProgressPie({ data, loading = false }) {
  const segments = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    value: Math.max(0, Number(data?.[segment.key] ?? 0)),
  }));
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Статус курсов</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Запланированные, в процессе, завершённые, отменённые</p>
      </div>
      <div className="h-56">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="inline-block h-40 w-full rounded-3xl bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        ) : hasData ? (
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
              <PieChart>
                <Pie data={segments} dataKey="value" nameKey="label" outerRadius="70%" innerRadius="50%" startAngle={90} endAngle={450}>
                  {segments.map((segment) => (
                    <Cell key={segment.key} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Нет данных по курсам
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <span>{segment.value.toLocaleString("ru-RU")}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-800">
          <span>Итого</span>
          <span>{total.toLocaleString("ru-RU")}</span>
        </div>
      </div>
    </div>
  );
}
