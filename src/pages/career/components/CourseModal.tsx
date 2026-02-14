import React from "react";
import toast from "react-hot-toast";
import Modal from "../../../components/Modal.jsx";
import { careerApi } from "../../../api/career.js";

const STATUS_OPTIONS = [
  { value: "planned", label: "Запланирован" },
  { value: "in_progress", label: "В процессе" },
  { value: "completed", label: "Завершён" },
  { value: "abandoned", label: "Отказ" },
];

const INITIAL_FORM = {
  title: "",
  platform: "",
  status: "planned",
  startDate: "",
  completionDate: "",
  progressPercent: 0,
  url: "",
  certificateUrl: "",
  rating: 0,
  notes: "",
};

export default function CourseModal({ open, course, skills = [], onClose, onSave, saving = false }) {
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [selectedSkills, setSelectedSkills] = React.useState([]);
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (course) {
      setForm({
        title: course.title || "",
        platform: course.platform || "",
        status: course.status || "planned",
        startDate: course.startDate || "",
        completionDate: course.completionDate || "",
        progressPercent: Number(course.progressPercent) || 0,
        url: course.url || "",
        certificateUrl: course.certificateUrl || "",
        rating: Number(course.rating) || 0,
        notes: course.notes || "",
      });
      setSelectedSkills(Array.isArray(course.skillIds) ? [...course.skillIds] : []);
    } else {
      setForm(INITIAL_FORM);
      setSelectedSkills([]);
    }
    setError("");
  }, [course, open]);

  const handleField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (id) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return Array.from(next);
    });
  };

  const handleFileUpload = async (event) => {
    if (!course) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await careerApi.uploadCourseCertificateFile(course.id, file);
      if (result.url) {
        setForm((prev) => ({ ...prev, certificateUrl: result.url }));
        toast.success("Файл загружен");
      }
    } catch (err) {
      toast.error(err?.message || "Не удалось загрузить сертификат");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Укажите название курса");
      return;
    }
    if (!form.platform.trim()) {
      setError("Укажите платформу");
      return;
    }
    if (!form.status) {
      setError("Выберите статус");
      return;
    }
    if (form.status === "in_progress") {
      const percent = Number(form.progressPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        setError("Прогресс должен быть от 0 до 100");
        return;
      }
    }
    const payload = {
      title: form.title.trim(),
      platform: form.platform.trim(),
      status: form.status,
      startDate: form.startDate || null,
      completionDate: form.completionDate || null,
      progressPercent: form.status === "in_progress" ? Number(form.progressPercent) : 0,
      url: form.url.trim() || null,
      certificateUrl: form.certificateUrl.trim() || null,
      rating: form.status === "completed" ? Number(form.rating) || null : null,
      notes: form.notes.trim() || null,
      skillIds: selectedSkills,
    };
    setError("");
    await onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={course ? "Редактировать курс" : "Новый курс"} maxWidth="max-w-4xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Название*
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleField("title", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Платформа*
            <input
              type="text"
              value={form.platform}
              onChange={(event) => handleField("platform", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Статус*
            <select
              value={form.status}
              onChange={(event) => handleField("status", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Дата начала
            <input
              type="date"
              value={form.startDate || ""}
              onChange={(event) => handleField("startDate", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Дата завершения
            <input
              type="date"
              value={form.completionDate || ""}
              onChange={(event) => handleField("completionDate", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          {form.status === "in_progress" && (
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Прогресс (%)
              <input
                type="number"
                min="0"
                max="100"
                value={form.progressPercent}
                onChange={(event) => handleField("progressPercent", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
              />
            </label>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Ссылка на курс
            <input
              type="url"
              value={form.url || ""}
              onChange={(event) => handleField("url", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Ссылка на сертификат
            <input
              type="url"
              value={form.certificateUrl || ""}
              onChange={(event) => handleField("certificateUrl", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
        </div>

        {course && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
              Загрузить файл сертификата
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-2 w-full text-xs text-slate-500 dark:text-slate-400"
              />
            </label>
            {uploading && <p className="text-xs text-slate-500 dark:text-slate-400">Загрузка...</p>}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Рейтинг (1-5)
            <input
              type="number"
              min="1"
              max="5"
              value={form.rating}
              onChange={(event) => handleField("rating", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Заметки
            <textarea
              value={form.notes}
              onChange={(event) => handleField("notes", event.target.value)}
              rows="3"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Навыки</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {skills.map((skill) => {
              const active = selectedSkills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`rounded-2xl border px-3 py-2 text-sm text-left transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
                  }`}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200 disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
