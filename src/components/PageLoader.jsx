import React from "react";

export default function PageLoader({ message = "Загружаем страницу..." }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center px-4 py-10">
      <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-5 py-4 shadow-lg shadow-indigo-100 ring-1 ring-indigo-100 backdrop-blur-md dark:bg-slate-800/70 dark:shadow-none dark:ring-slate-700">
        <span
          className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{message}</span>
      </div>
    </div>
  );
}
