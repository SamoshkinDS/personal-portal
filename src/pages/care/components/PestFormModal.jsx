import React from "react";
import Modal from "../../../components/Modal.jsx";
import PlantArticleEditorLazy from "../../../components/plants/PlantArticleEditorLazy.jsx";

const EMPTY_DOC = { type: "doc", content: [] };
const DEFAULT_FORM = {
  name: "",
  description: "",
  danger_level: "",
  symptoms: "",
  active_period: "",
  fight_text: EMPTY_DOC,
  fight_text_plain: "",
};

const DANGER_OPTIONS = [
  { value: "low", label: "Низкая" },
  { value: "medium", label: "Средняя" },
  { value: "high", label: "Высокая" },
];

export default function PestFormModal({ open, onClose, initialValue, onSubmit, loading }) {
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [editorOpen, setEditorOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const baseValue = initialValue ? { ...initialValue } : {};
    delete baseValue.photo_url;
    setForm({
      ...DEFAULT_FORM,
      ...baseValue,
      fight_text: initialValue?.fight_text || EMPTY_DOC,
      fight_text_plain: initialValue?.fight_text_plain || "",
    });
  }, [initialValue, open]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    onSubmit?.(form);
  };

  const handleArticleSave = ({ content_rich, content_text }) => {
    setForm((prev) => ({
      ...prev,
      fight_text: content_rich || EMPTY_DOC,
      fight_text_plain: content_text || "",
    }));
    setEditorOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initialValue ? "Редактирование вредителя" : "Добавить вредителя"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">??????????????? *</label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              placeholder="???>??"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Описание</label>
            <textarea
              value={form.description || ""}
              onChange={handleChange("description")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              placeholder="Краткое описание вредителя"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Опасность</label>
              <select
                value={form.danger_level || ""}
                onChange={handleChange("danger_level")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              >
                <option value="">Не указано</option>
                {DANGER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Период активности</label>
              <input
                type="text"
                value={form.active_period || ""}
                onChange={handleChange("active_period")}
                placeholder="Весна-лето"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Признаки поражения</label>
            <textarea
              value={form.symptoms || ""}
              onChange={handleChange("symptoms")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              placeholder="Скрученные листья, липкие выделения..."
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Блок «Как бороться»</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rich-text, хранится как JSON + Markdown</p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="rounded-2xl border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-400/40 dark:text-blue-200"
              >
                Редактировать
              </button>
            </div>
            {form.fight_text_plain ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{form.fight_text_plain}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Пока пусто</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <PlantArticleEditorLazy
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialContent={form.fight_text || EMPTY_DOC}
        initialMarkdown={form.fight_text_plain || ""}
        onSave={handleArticleSave}
        loading={false}
        modalTitle="Как бороться"
      />
    </>
  );
}
