import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ChartWrapper from "../../../../components/ChartWrapper.tsx";

export default function PortfolioAnalyticsSection({ data }) {
  const calendar = data?.activity_calendar || [];
  const skillsProjects = data?.skills_project_map || [];
  const bubble = data?.bubble_data || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70 space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Портфель</h3>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Календарь активности</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {calendar.map((entry) => (
            <div
              key={entry.day}
              className="h-6 w-6 rounded border border-slate-200 bg-emerald-100 text-[10px] leading-6 text-center text-slate-600 dark:border-white/10 dark:bg-emerald-500/20 dark:text-emerald-200"
            >
              {entry.count}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Навыки через проекты</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {skillsProjects.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-white/10 dark:bg-slate-800/60">
              <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
              <div>Навыков: {item.skillCount}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-64">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Bubble chart</div>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%" style={{ minHeight: 1, minWidth: 1 }}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="duration" name="duration" unit="days" />
              <YAxis type="number" dataKey="skillCount" name="skills" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={bubble} fill="#2563EB" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
}
