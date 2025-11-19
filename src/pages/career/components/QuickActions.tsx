import React from "react";
import clsx from "clsx";

const ACTIONS = [
  { type: "skill", label: "+ Навык" },
  { type: "course", label: "+ Курс" },
  { type: "project", label: "+ Проект" },
  { type: "interview", label: "+ Собеседование" },
];

export default function QuickActions({ onAction, disabled = false }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Быстрые действия</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Открытие модалок добавления знаний</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((action) => (
          <button
            key={action.type}
            type="button"
            onClick={() => onAction(action.type)}
            disabled={disabled}
            className={clsx(
              "rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition",
              "hover:border-slate-300 hover:bg-slate-200 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:hover:bg-slate-900/70",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
