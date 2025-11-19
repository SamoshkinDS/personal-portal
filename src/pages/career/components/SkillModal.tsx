import React from "react";
import Modal from "../../../components/Modal.jsx";

const INITIAL_FORM = {
  name: "",
  category: "",
  level: 1,
  description: "",
  iconUrl: "",
};

export default function SkillModal({ open, skill, onClose, onSave, saving = false }) {
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (skill) {
      setForm({
        name: skill.name || "",
        category: skill.category || "",
        level: skill.level || 1,
        description: skill.description || "",
        iconUrl: skill.iconUrl || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError("");
  }, [skill, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Название обязательно");
      return;
    }
    if (!form.category.trim()) {
      setError("Категория обязательно");
      return;
    }
    if (form.level < 1 || form.level > 5) {
      setError("Уровень должен быть от 1 до 5");
      return;
    }
    setError("");
    await onSave({
      name: form.name.trim(),
      category: form.category.trim(),
      level: Number(form.level),
      description: form.description.trim(),
      iconUrl: form.iconUrl.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={skill ? "Редактировать навык" : "Новый навык"} maxWidth="max-w-xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
          Название
          <input
            type="text"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
          Категория
          <input
            type="text"
            value={form.category}
            onChange={(event) => handleChange("category", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
          Уровень (1-5)
          <input
            type="number"
            min="1"
            max="5"
            value={form.level}
            onChange={(event) => handleChange("level", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
          Описание
          <textarea
            value={form.description}
            onChange={(event) => handleChange("description", event.target.value)}
            rows="3"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-200">
          URL иконки
          <input
            type="url"
            value={form.iconUrl}
            onChange={(event) => handleChange("iconUrl", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
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
