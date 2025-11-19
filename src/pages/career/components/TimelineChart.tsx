import React from "react";

const STATUS_COLORS = {
  active: "#2563EB",
  completed: "#16A34A",
  archived: "#64748B",
};

const STATUS_LABELS = {
  active: "Активный",
  completed: "Завершён",
  archived: "Архив",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
};

export default function TimelineChart({ projects = [] }) {
  const mapped = React.useMemo(() => {
    const list = projects
      .map((project) => ({
        ...project,
        start: project.start ? new Date(project.start) : null,
        end: project.end ? new Date(project.end) : null,
      }))
      .sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));
    return list;
  }, [projects]);

  if (!mapped.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
        Нет проектов для отображения
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
        {mapped.map((project) => {
          const color = STATUS_COLORS[project.status] || STATUS_COLORS.active;
          return (
            <div key={project.id} className="flex flex-wrap items-center gap-4 border-b border-slate-100/80 py-3 last:border-b-0 dark:border-white/5">
              <span className="h-12 w-1 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{project.title}</div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {project.role} · {project.company}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatDate(project.start)} — {project.end ? formatDate(project.end) : "по настоящее время"}
                </div>
              </div>
              <span
                className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase text-white"
                style={{ backgroundColor: color }}
              >
                {project.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
