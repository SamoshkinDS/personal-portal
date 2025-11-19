import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";

const PROFILE_FIELDS = [
  { key: "name", label: "Имя" },
  { key: "specialization", label: "Специализация" },
  { key: "email", label: "Email" },
  { key: "telegram", label: "Telegram" },
  { key: "summary", label: "О себе" },
];

export default function PortfolioExportPage() {
  const [projects, setProjects] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());
  const [profile, setProfile] = React.useState({
    name: "",
    specialization: "",
    email: "",
    telegram: "",
    summary: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await careerApi.listPortfolioProjects();
        setProjects(data);
      } catch (error) {
        toast.error(error?.message || "Не удалось загрузить проекты");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleProject = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    if (!selected.size) {
      toast.error("Выберите хотя бы один проект");
      return;
    }
    setExporting(true);
    try {
      const buffer = await careerApi.exportPortfolioResume({
        project_ids: Array.from(selected),
        profile,
      });
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume.pdf";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF сформирован и скачивается");
    } catch (error) {
      toast.error(error?.message || "Не удалось сформировать PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell title="Экспорт резюме">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Профиль</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {PROFILE_FIELDS.map((field) => (
              <label key={field.key} className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                {field.label}
                <input
                  type="text"
                  value={profile[field.key]}
                  onChange={(event) => handleField(field.key, event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Выберите проекты</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Загружаем...</p>
            ) : (
              projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  <span>
                    {project.title} ({project.company})
                    <br />
                    <span className="text-xs font-normal">{project.role}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selected.has(project.id)}
                    onChange={() => toggleProject(project.id)}
                  />
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200 disabled:opacity-60"
          >
            {exporting ? "Формируем PDF..." : "Скачать PDF"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
