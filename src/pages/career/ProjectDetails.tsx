import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [skills, setSkills] = React.useState([]);

  React.useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        setLoading(true);
        const [data, skillsList] = await Promise.all([
          careerApi.getPortfolioProject(projectId),
          careerApi.listSkills(),
        ]);
        setProject(data);
        setSkills(skillsList);
      } catch (error) {
        toast.error(error?.message || "Не удалось загрузить проект");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  if (loading) {
    return (
      <PageShell title="Проект">
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
          Загружаем проект...
        </div>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell title="Проект">
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          Проект не найден
        </div>
      </PageShell>
    );
  }

  const metricEntries = project.metrics ? Object.entries(project.metrics) : [];

  return (
    <PageShell title={`Проект: ${project.title}`}>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← Назад
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-6 shadow dark:border-white/5 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{project.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {project.company} · {project.role}
              </p>
            </div>
            <span className="rounded-2xl border border-indigo-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:border-indigo-400/40 dark:text-indigo-200 dark:bg-indigo-500/10">
              {project.status}
            </span>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Период</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {formatDate(project.startDate)} — {project.endDate ? formatDate(project.endDate) : "по настоящее время"}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Ссылка</div>
              <a href={project.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline dark:text-blue-300">
                {project.url || "Не указана"}
              </a>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>{project.description}</p>
            {project.achievements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Достижения</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {project.achievements.map((achievement, index) => (
                    <li key={index}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {metricEntries.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {metricEntries.map(([key, value]) => (
                <span key={key} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}

          {project.skillIds?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.skillIds.map((id) => {
                const skill = skills.find((entry) => entry.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                  >
                    {skill?.name || `Навык ${id}`}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
