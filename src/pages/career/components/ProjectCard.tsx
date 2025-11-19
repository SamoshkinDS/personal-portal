import React from "react";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  active: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  archived: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

export default function ProjectCard({ project, skillsMap = new Map(), onEdit, onDelete }) {
  const truncatedDescription = project.description
    ? project.description.length > 150
      ? `${project.description.slice(0, 147)}…`
      : project.description
    : "Описание не указано";

  const skillNames = (project.skillIds || [])
    .map((id) => skillsMap.get(id)?.name)
    .filter(Boolean);

  const statusClass = STATUS_STYLES[project.status] || STATUS_STYLES.active;

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{project.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {project.company || "Компания не указана"} · {project.role || "Роль не указана"}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass}`}>
            {project.status || "active"}
          </span>
        </div>

        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {formatDate(project.startDate)} — {project.endDate ? formatDate(project.endDate) : "по настоящее время"}
        </div>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{truncatedDescription}</p>

        {skillNames.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skillNames.map((name) => (
              <span key={name} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <Link
          to={`/career/portfolio/${project.id}`}
          className="text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:text-blue-700 dark:text-blue-300"
        >
          Подробнее
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(project)}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
