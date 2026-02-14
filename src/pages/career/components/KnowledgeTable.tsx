import React from "react";

const HEADERS = ["Технология", "Версия", "Категория", "Обновлено", "Действия"];

export default function KnowledgeTable({ items, loading, onView, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-20 rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/60" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
        Записей нет
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/90 shadow dark:border-white/5 dark:bg-slate-900/70">
      <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600 dark:divide-white/5 dark:text-slate-300">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900/40 dark:text-slate-500">
          <tr>
            {HEADERS.map((label) => (
              <th key={label} className="px-4 py-3 text-left font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.technology}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.category || "-"}</div>
              </td>
              <td className="px-4 py-3">{item.currentVersion || "-"}</td>
              <td className="px-4 py-3">{item.category || "-"}</td>
              <td className="px-4 py-3">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("ru-RU") : "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onView(item)} className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                    Просмотр
                  </button>
                  <button type="button" onClick={() => onEdit(item)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    Редактировать
                  </button>
                  <button type="button" onClick={() => onDelete(item)} className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
