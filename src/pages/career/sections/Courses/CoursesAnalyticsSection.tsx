import React from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ChartWrapper from "../../../../components/ChartWrapper.tsx";

const COLORS = ["#2563EB", "#16A34A", "#FBBF24", "#8B5CF6"];

export default function CoursesAnalyticsSection({ data }) {
  const monthly = data?.monthly_completed || [];
  const platforms = data?.platforms || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Курсы</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/60">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Завершено по месяцам</div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <div className="h-64 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/60">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Платформы</div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
              <PieChart>
                <Pie data={platforms} dataKey="count" nameKey="platform" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                  {platforms.map((entry, index) => (
                    <Cell key={entry.platform} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}
