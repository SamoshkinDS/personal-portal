import React from "react";

const ENTITY_LABELS = {
  skill: "Навык",
  course: "Курс",
  project: "Проект",
  interview: "Собеседование",
  knowledge: "Техническое знание",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivity({ items = [], loading = false }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Последние активности</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Взаимодействия с навыками, курсами, проектами и интервью
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Показывается {items.length} из 5
        </span>
      </div>
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-dashed border-slate-200/70 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/60"
              >
                <div className="h-3 w-24 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-2 h-4 w-32 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-2 h-3 w-12 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            ))
          : items.length
          ? items.map((item, index) => (
              <div
                key={`${item.entity}-${item.updatedAt}-${index}`}
                className="rounded-2xl border border-white/10 bg-slate-50/60 p-4 shadow-sm transition dark:border-white/5 dark:bg-slate-900/70"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  <span>{ENTITY_LABELS[item.entity] || "Элемент"}</span>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.summary}</p>
                {item.tag && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {item.tag}
                  </div>
                )}
              </div>
            ))
          : (
            <div className="rounded-2xl border border-dashed border-slate-300/80 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Активность пока отсутствует
            </div>
          )}
      </div>
    </div>
  );
}
