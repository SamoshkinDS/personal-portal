import React from "react";

const STATUS_STYLES = {
  scheduled: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200",
  passed: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  rejected: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200",
  offer_received: "border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-200",
  offer_declined: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200",
};

const TYPE_BADGE = "rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200";

export default function InterviewsTable({ interviews, loading, onView, onEdit, onDelete, onSort, sortField, sortOrder }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-900/60" />
        ))}
      </div>
    );
  }

  const toggleSort = (field) => {
    const direction = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    onSort(field, direction);
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/90 shadow dark:border-white/5 dark:bg-slate-900/70">
      <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600 dark:divide-white/5 dark:text-slate-300">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-900/40 dark:text-slate-500">
          <tr>
            {[
              { label: "Дата", field: "interview_date" },
              { label: "Компания", field: "company" },
              { label: "Позиция", field: null },
              { label: "Тип", field: null },
              { label: "Статус", field: null },
              { label: "Рекрутер", field: null },
              { label: "ЗП", field: null },
              { label: "Действия", field: null },
            ].map((column) => (
              <th
                key={column.label}
                className="px-4 py-3 text-left font-semibold"
                onClick={() => column.field && toggleSort(column.field)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {sortField === column.field ? (
                    <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {interviews.map((interview) => (
            <tr key={interview.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition">
              <td className="px-4 py-3">{interview.interviewDate ? new Date(interview.interviewDate).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
              <td className="px-4 py-3">{interview.company || "—"}</td>
              <td className="px-4 py-3">{interview.position || "—"}</td>
              <td className="px-4 py-3">
                <span className={TYPE_BADGE}>{interview.interviewType || "—"}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[interview.status] || STATUS_STYLES.scheduled}`}>
                  {interview.status || "—"}
                </span>
              </td>
              <td className="px-4 py-3">{interview.recruiterName || "—"}</td>
              <td className="px-4 py-3">{interview.salaryOffer ? Number(interview.salaryOffer).toLocaleString("ru-RU") : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onView(interview)} className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                    👁️
                  </button>
                  <button type="button" onClick={() => onEdit(interview)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    ✏️
                  </button>
                  <button type="button" onClick={() => onDelete(interview)} className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                    🗑️
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
