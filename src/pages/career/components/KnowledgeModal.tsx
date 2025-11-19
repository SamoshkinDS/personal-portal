import React from "react";
import Modal from "../../../components/Modal.jsx";

const INITIAL_FORM = {
  technology: "",
  currentVersion: "",
  category: "",
  bestPractices: "",
  usefulLinks: [{ title: "", url: "" }],
  notes: "",
};

function ensureLinkArray(value) {
  return Array.isArray(value) && value.length ? value : [{ title: "", url: "" }];
}

export default function KnowledgeModal({ open, item, templates = [], onClose, onSave, saving = false }) {
  const [form, setForm] = React.useState(INITIAL_FORM);

  React.useEffect(() => {
    if (item) {
      setForm({
        technology: item.technology || "",
        currentVersion: item.currentVersion || "",
        category: item.category || "",
        bestPractices: item.bestPractices || "",
        usefulLinks: ensureLinkArray(item.usefulLinks),
        notes: item.notes || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [item, open]);

  const handleField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateLink = (index, key, value) => {
    setForm((prev) => {
      const copy = [...prev.usefulLinks];
      copy[index] = { ...copy[index], [key]: value };
      return { ...prev, usefulLinks: copy };
    });
  };

  const addLink = () => {
    setForm((prev) => ({ ...prev, usefulLinks: [...prev.usefulLinks, { title: "", url: "" }] }));
  };

  const removeLink = (index) => {
    setForm((prev) => ({ ...prev, usefulLinks: prev.usefulLinks.filter((_, idx) => idx !== index) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.technology.trim() || !form.category.trim()) {
      return;
    }
    await onSave({
      technology: form.technology.trim(),
      currentVersion: form.currentVersion.trim() || null,
      category: form.category.trim(),
      bestPractices: form.bestPractices.trim() || null,
      usefulLinks: form.usefulLinks.filter((link) => link.title && link.url),
      notes: form.notes.trim() || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "Редактировать технологию" : "Новая технология"} maxWidth="max-w-4xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Технология*
            <input
              type="text"
              value={form.technology}
              onChange={(event) => handleField("technology", event.target.value)}
              list="knowledge-templates"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
            <datalist id="knowledge-templates">
              {templates.map((template) => (
                <option key={template.technology} value={template.technology} />
              ))}
            </datalist>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Категория*
            <input
              type="text"
              value={form.category}
              onChange={(event) => handleField("category", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Версия
            <input
              type="text"
              value={form.currentVersion}
              onChange={(event) => handleField("currentVersion", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Best practices</p>
          <textarea
            value={form.bestPractices}
            onChange={(event) => handleField("bestPractices", event.target.value)}
            rows="4"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          />
        </div>

        <div>
          <p className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Полезные ссылки
            <button type="button" onClick={addLink} className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              + добавить
            </button>
          </p>
          <div className="space-y-2">
            {form.usefulLinks.map((link, index) => (
              <div key={`link-${index}`} className="grid gap-2 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Название"
                  value={link.title}
                  onChange={(event) => updateLink(index, "title", event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(event) => updateLink(index, "url", event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
                />
                {form.usefulLinks.length > 1 && (
                  <button type="button" onClick={() => removeLink(index)} className="text-rose-500">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Заметки</p>
          <textarea
            value={form.notes}
            onChange={(event) => handleField("notes", event.target.value)}
            rows="4"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          />
        </div>

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
