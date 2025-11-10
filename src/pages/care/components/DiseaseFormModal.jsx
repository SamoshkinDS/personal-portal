import React from "react";
import Modal from "../../../components/Modal.jsx";
import PlantArticleEditor from "../../../components/plants/PlantArticleEditor.jsx";

const EMPTY_DOC = { type: "doc", content: [] };
const DEFAULT_FORM = {
  name: "",
  description: "",
  photo_url: "",
  reason: "",
  disease_type: "",
  symptoms: "",
  prevention: "",
  treatment_text: EMPTY_DOC,
  treatment_text_plain: "",
};

const TYPE_OPTIONS = ["Грибковое", "Бактериальное", "Вирусное", "Паразитарное", "Физиологическое"];

export default function DiseaseFormModal({ open, onClose, initialValue, onSubmit, loading }) {
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [editorOpen, setEditorOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm({
      ...DEFAULT_FORM,
      ...(initialValue || {}),
      treatment_text: initialValue?.treatment_text || EMPTY_DOC,
      treatment_text_plain: initialValue?.treatment_text_plain || "",
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
      treatment_text: content_rich || EMPTY_DOC,
      treatment_text_plain: content_text || "",
    }));
    setEditorOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initialValue ? "Редактирование заболевания" : "Добавить заболевание"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Название *</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Фото (URL)</label>
              <input
                type="url"
                value={form.photo_url || ""}
                onChange={handleChange("photo_url")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Описание</label>
            <textarea
              value={form.description || ""}
              onChange={handleChange("description")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Тип</label>
              <select
                value={form.disease_type || ""}
                onChange={handleChange("disease_type")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              >
                <option value="">Не указано</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Причина</label>
              <input
                type="text"
                value={form.reason || ""}
                onChange={handleChange("reason")}
                placeholder="Перелив, нехватка света..."
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Симптомы</label>
            <textarea
              value={form.symptoms || ""}
              onChange={handleChange("symptoms")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Профилактика</label>
            <textarea
              value={form.prevention || ""}
              onChange={handleChange("prevention")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Блок «Как лечить»</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rich-text описание терапии</p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="rounded-2xl border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:border-purple-400/40 dark:text-purple-200"
              >
                Редактировать
              </button>
            </div>
            {form.treatment_text_plain ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{form.treatment_text_plain}</p>
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
              className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-60"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <PlantArticleEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialContent={form.treatment_text || EMPTY_DOC}
        initialMarkdown={form.treatment_text_plain || ""}
        onSave={handleArticleSave}
        loading={false}
        modalTitle="Как лечить"
      />
    </>
  );
}
