// encoding: utf-8
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#6366F1", "#F97316", "#0EA5E9", "#10B981", "#EC4899", "#FACC15", "#14B8A6", "#818CF8"];

function renderTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-xl">
      <div className="font-medium">{item.name}</div>
      <div className="mt-1 text-slate-300">{item.value?.toLocaleString("ru-RU")} ₽</div>
    </div>
  );
}

export default function PieExpensesByCategory({ data = [] }) {
  const chartData = useMemo(
    () =>
      data.map((item, index) => ({
        name: item.name,
        value: Number(item.amount) || 0,
        fill: item.color_hex || COLORS[index % COLORS.length],
      })),
    [data]
  );

  if (!chartData.length) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
        Нет данных за выбранный период
      </div>
    );
  }

  return (
    <div className="h-72 w-full text-slate-900 dark:text-white">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
          >
            {chartData.map((entry, index) => (
              <Cell key={`slice-${entry.name}-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
