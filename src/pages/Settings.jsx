// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import { useTheme } from "../hooks/useTheme.js";

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <PageShell
      title="Настройки"
      contentClassName="settings settings--preferences flex flex-col gap-6 bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70"
    >
      <section className="settings__appearance flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-500 dark:border-gray-700 dark:bg-slate-900">
        <header>
          <h2 className="settings__subtitle text-xl font-semibold">Тема интерфейса</h2>
          <p className="settings__description mt-1 text-sm text-gray-500 dark:text-gray-400">
            Переключайте светлый и тёмный режим одним кликом. Предпочтение синхронизировано
            во всех разделах портала.
          </p>
        </header>
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          className="settings__toggle group flex items-center gap-4 rounded-2xl border border-transparent bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
        >
          <span
            className={`settings__toggle-track relative h-10 w-20 rounded-full transition-colors duration-500 ${
              isDark ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`settings__toggle-thumb absolute top-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-500 shadow-lg transition-all duration-500 ${
                isDark ? "translate-x-10" : ""
              }`}
            >
              {isDark ? "Тьма" : "Свет"}
            </span>
          </span>
          <span className="settings__toggle-label text-sm font-medium text-gray-700 dark:text-gray-100">
            {isDark ? "Тёмная тема активна" : "Светлая тема активна"}
          </span>
        </button>
      </section>

      <section className="settings__notes rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-4 text-xs text-gray-500 shadow-sm transition-colors duration-500 dark:border-gray-600 dark:bg-slate-900/50 dark:text-gray-400">
        Изменение сохраняется в localStorage и применяется моментально без перезагрузки.
      </section>
    </PageShell>
  );
}
