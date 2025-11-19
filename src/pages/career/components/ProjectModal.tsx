import React from "react";
import Modal from "../../../components/Modal.jsx";

const STATUS_OPTIONS = [
  { value: "active", label: "Активный" },
  { value: "completed", label: "Завершён" },
  { value: "archived", label: "Архив" },
];

function mapObjectToPairs(obj = {}) {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

export default function ProjectModal({ open, project, skills = [], onClose, onSave, saving = false }) {
  const [form, setForm] = React.useState({
    title: "",
    company: "",
    role: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "active",
    url: "",
    achievements: [""],
    metrics: [{ key: "", value: "" }],
    skillIds: [],
    ongoing: false,
  });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (project) {
      setForm({
        title: project.title || "",
        company: project.company || "",
        role: project.role || "",
        description: project.description || "",
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        status: project.status || "active",
        url: project.url || "",
        achievements: project.achievements?.length ? [...project.achievements] : [""],
        metrics: mapObjectToPairs(project.metrics),
        skillIds: Array.isArray(project.skillIds) ? [...project.skillIds] : [],
        ongoing: !project.endDate,
      });
    } else {
      setForm({
        title: "",
        company: "",
        role: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "active",
        url: "",
        achievements: [""],
        metrics: [{ key: "", value: "" }],
        skillIds: [],
        ongoing: false,
      });
    }
    setError("");
  }, [project, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAchievementChange = (index, value) => {
    setForm((prev) => {
      const copy = [...prev.achievements];
      copy[index] = value;
      return { ...prev, achievements: copy };
    });
  };

  const appendAchievement = () => {
    setForm((prev) => ({ ...prev, achievements: [...prev.achievements, ""] }));
  };

  const removeAchievement = (index) => {
    setForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, idx) => idx !== index),
    }));
  };

  const handleMetricChange = (index, key, value) => {
    setForm((prev) => {
      const copy = prev.metrics.map((item, idx) => (idx === index ? { ...item, [key]: value } : item));
      return { ...prev, metrics: copy };
    });
  };

  const appendMetric = () => {
    setForm((prev) => ({ ...prev, metrics: [...prev.metrics, { key: "", value: "" }] }));
  };

  const removeMetric = (index) => {
    setForm((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, idx) => idx !== index),
    }));
  };

  const toggleSkill = (id) => {
    setForm((prev) => {
      const set = new Set(prev.skillIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, skillIds: Array.from(set) };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.role.trim() || !form.startDate) {
      setError("Обязательные поля: название, компания, роль, дата начала");
      return;
    }
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      role: form.role.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.ongoing ? null : form.endDate || null,
      status: form.status,
      url: form.url.trim() || null,
      achievements: form.achievements.filter(Boolean),
      metrics: form.metrics.reduce((acc, entry) => {
        if (entry.key.trim()) {
          acc[entry.key.trim()] = entry.value.trim();
        }
        return acc;
      }, {}),
      skillIds: form.skillIds,
    };
    setError("");
    await onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? "Редактировать проект" : "Новый проект"} maxWidth="max-w-4xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Название*
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Компания*
            <input
              type="text"
              value={form.company}
              onChange={(event) => handleChange("company", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Роль*
            <input
              type="text"
              value={form.role}
              onChange={(event) => handleChange("role", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
        </div>

        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
          Описание (markdown)
          <textarea
            value={form.description}
            onChange={(event) => handleChange("description", event.target.value)}
            rows="4"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Дата начала*
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => handleChange("startDate", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Дата завершения
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => handleChange("endDate", event.target.value)}
              disabled={form.ongoing}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.ongoing}
              onChange={(event) => handleChange("ongoing", event.target.checked)}
            />
            По настоящее время
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Статус
            <select
              value={form.status}
              onChange={(event) => handleChange("status", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Ссылка
            <input
              type="url"
              value={form.url}
              onChange={(event) => handleChange("url", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Достижения</p>
            <button type="button" onClick={appendAchievement} className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              + Добавить
            </button>
          </div>
          <div className="space-y-2">
            {form.achievements.map((value, index) => (
              <div key={`achievement-${index}`} className="flex items-center gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(event) => handleAchievementChange(index, event.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                  placeholder="Достижение"
                />
                {form.achievements.length > 1 && (
                  <button type="button" onClick={() => removeAchievement(index)} className="text-rose-500">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Метрики</p>
            <button type="button" onClick={appendMetric} className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              + Добавить
            </button>
          </div>
          <div className="space-y-2">
            {form.metrics.map((metric, index) => (
              <div key={`metric-${index}`} className="grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  value={metric.key}
                  onChange={(event) => handleMetricChange(index, "key", event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                  placeholder="Название метрики"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(event) => handleMetricChange(index, "value", event.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                    placeholder="Значение"
                  />
                  {form.metrics.length > 1 && (
                    <button type="button" onClick={() => removeMetric(index)} className="text-rose-500">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Навыки</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  form.skillIds.includes(skill.id)
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/30"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
