import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import PortfolioFilters from "./components/PortfolioFilters.tsx";
import ProjectCard from "./components/ProjectCard.tsx";
import ProjectModal from "./components/ProjectModal.tsx";

const DEFAULT_FILTERS = {
  statuses: [],
  search: "",
  periodMonths: 0,
};

export default function PortfolioPage() {
  const [projects, setProjects] = React.useState([]);
  const [skills, setSkills] = React.useState([]);
  const [filters, setFilters] = React.useState({ ...DEFAULT_FILTERS });
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [projectsList, skillsList] = await Promise.all([
        careerApi.listPortfolioProjects(),
        careerApi.listSkills(),
      ]);
      setProjects(projectsList);
      setSkills(skillsList);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить портфолио");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const statusList = filters.statuses || [];

  const filteredProjects = React.useMemo(() => {
    const threshold =
      filters.periodMonths > 0
        ? new Date(new Date().setMonth(new Date().getMonth() - filters.periodMonths))
        : null;

    return projects.filter((project) => {
      const matchesStatus = statusList.length ? statusList.includes(project.status) : true;
      const matchesSearch = filters.search
        ? `${project.title || ""} ${project.company || ""}`
            .toLowerCase()
            .includes(filters.search.trim().toLowerCase())
        : true;
      const matchesPeriod = threshold
        ? (() => {
            const compareDate = project.endDate
              ? new Date(project.endDate)
              : project.startDate
              ? new Date(project.startDate)
              : null;
            if (!compareDate || Number.isNaN(compareDate.getTime())) return true;
            return compareDate >= threshold;
          })()
        : true;
      return matchesStatus && matchesSearch && matchesPeriod;
    });
  }, [projects, filters, statusList]);

  const handleEdit = (project = null) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async (payload) => {
    try {
      setSaving(true);
      if (editingProject) {
        await careerApi.updatePortfolioProject(editingProject.id, payload);
        toast.success("Проект обновлён");
      } else {
        await careerApi.createPortfolioProject(payload);
        toast.success("Проект создан");
      }
      handleCloseModal();
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось сохранить проект");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Удалить проект "${project.title}"?`)) return;
    try {
      setSaving(true);
      await careerApi.deletePortfolioProject(project.id);
      toast.success("Проект удалён");
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось удалить проект");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="Портфолио">
      <div className="space-y-6">
        <PortfolioFilters filters={filters} onChange={setFilters} disabled={loading} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Найдено {filteredProjects.length} из {projects.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Статусы: {statusList.length ? statusList.join(", ") : "все"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleEdit(null)}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            + Добавить проект
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              Нет проектов, соответствующих фильтрам
            </div>
          )}
          {loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="h-4 w-48 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-3 h-3 w-32 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-3 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            ))}
          {!loading &&
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                skillsMap={new Map(skills.map((skill) => [skill.id, skill]))}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
        </div>
      </div>

      <ProjectModal
        open={modalOpen}
        project={editingProject}
        skills={skills}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        saving={saving}
      />
    </PageShell>
  );
}
