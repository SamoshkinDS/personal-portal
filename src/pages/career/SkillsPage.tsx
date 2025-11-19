import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import SkillCard from "./components/SkillCard.tsx";
import SkillsFilters from "./components/SkillsFilters.tsx";
import SkillModal from "./components/SkillModal.tsx";

const DEFAULT_FILTERS = {
  search: "",
  categories: [],
  level: null,
};

export default function SkillsPage() {
  const [skills, setSkills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState(DEFAULT_FILTERS);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingSkill, setEditingSkill] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const loadSkills = React.useCallback(async () => {
    try {
      setLoading(true);
      const items = await careerApi.listSkills();
      setSkills(items);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить список навыков");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const uniqueCategories = React.useMemo(() => {
    const set = new Set();
    skills.forEach((skill) => {
      if (skill.category) set.add(skill.category);
    });
    return Array.from(set);
  }, [skills]);

  const filteredSkills = React.useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch = filters.search
        ? skill.name.toLowerCase().includes(filters.search.trim().toLowerCase())
        : true;
      const matchesCategory =
        filters.categories?.length > 0 ? filters.categories.includes(skill.category) : true;
      const matchesLevel = filters.level ? Number(skill.level || 0) >= filters.level : true;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [skills, filters]);

  const openModalFor = (skill = null) => {
    setEditingSkill(skill);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSkill(null);
  };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingSkill) {
        await careerApi.updateSkill(editingSkill.id, payload);
        toast.success("Навык обновлён");
      } else {
        await careerApi.createSkill(payload);
        toast.success("Навык создан");
      }
      closeModal();
      await loadSkills();
    } catch (error) {
      toast.error(error?.message || "Не удалось сохранить навык");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const confirmed = window.confirm(`Удалить навык "${skill.name}"?`);
    if (!confirmed) return;
    try {
      setSaving(true);
      await careerApi.deleteSkill(skill.id);
      toast.success("Навык удалён");
      await loadSkills();
    } catch (error) {
      toast.error(error?.message || "Не удалось удалить навык");
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <PageShell title="Навыки">
      <div className="space-y-6">
        <SkillsFilters
          categories={uniqueCategories}
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          disabled={loading}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Найдено {filteredSkills.length} из {skills.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Фильтрация обновляется мгновенно</p>
          </div>
          <button
            type="button"
            onClick={() => openModalFor(null)}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            + Добавить навык
          </button>
        </div>

        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${filteredSkills.length === 0 ? "min-h-[200px]" : ""}`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="h-5 w-32 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-3 h-4 w-24 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="mt-4 h-3 w-16 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            ))
          ) : filteredSkills.length ? (
            filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={openModalFor}
                onDelete={handleDelete}
                disabled={saving}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              Подходящие навыки не найдены
            </div>
          )}
        </div>
      </div>

      <SkillModal open={modalOpen} skill={editingSkill} onClose={closeModal} onSave={handleSave} saving={saving} />
    </PageShell>
  );
}
