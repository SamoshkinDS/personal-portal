import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import ChartWrapper from "../../../../components/ChartWrapper.tsx";

export default function InterviewsAnalyticsSection({ data }) {
  const funnel = data?.funnel || [];
  const salary = data?.salary_by_years || [];
  const companies = data?.top_companies || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Интервью</h3>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
          <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Воронка</div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={200} style={{ minHeight: 1, minWidth: 1 }}>
              <BarChart layout="vertical" data={funnel}>
                <XAxis type="number" hide />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
          <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Средняя ЗП</div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={200} style={{ minHeight: 1, minWidth: 1 }}>
              <LineChart data={salary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5f5" />
                <XAxis dataKey="year" />
                <Tooltip />
                <Line type="monotone" dataKey="avg_salary" stroke="#16A34A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
          <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Топ компаний</div>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={200} style={{ minHeight: 1, minWidth: 1 }}>
              <BarChart data={companies}>
                <XAxis dataKey="company" hide />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}
