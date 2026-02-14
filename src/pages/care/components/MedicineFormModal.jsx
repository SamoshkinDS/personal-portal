import React from "react";
import Modal from "../../../components/Modal.jsx";
import PlantArticleEditorLazy from "../../../components/plants/PlantArticleEditorLazy.jsx";

const EMPTY_DOC = { type: "doc", content: [] };
const DEFAULT_FORM = {
  name: "",
  description: "",
  medicine_type: "",
  form: "",
  concentration: "",
  expiration_date: "",
  instruction: EMPTY_DOC,
  instruction_text: "",
  shop_links: "",
};

const TYPE_OPTIONS = ["Инсектицид", "Фунгицид", "Акарицид", "Универсальное"];
const FORM_OPTIONS = ["Спрей", "Раствор", "Порошок", "Гель", "Концентрат"];

export default function MedicineFormModal({ open, onClose, initialValue, onSubmit, loading }) {
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [editorOpen, setEditorOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const baseValue = initialValue ? { ...initialValue } : {};
    delete baseValue.photo_url;
    setForm({
      ...DEFAULT_FORM,
      ...baseValue,
      instruction: initialValue?.instruction || EMPTY_DOC,
      instruction_text: initialValue?.instruction_text || "",
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
      instruction: content_rich || EMPTY_DOC,
      instruction_text: content_text || "",
    }));
    setEditorOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={initialValue ? "Редактирование лекарства" : "Добавить лекарство"}
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
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Описание</label>
            <textarea
              value={form.description || ""}
              onChange={handleChange("description")}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Тип</label>
              <select
                value={form.medicine_type || ""}
                onChange={handleChange("medicine_type")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
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
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Форма</label>
              <select
                value={form.form || ""}
                onChange={handleChange("form")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              >
                <option value="">Не указано</option>
                {FORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Концентрация</label>
              <input
                type="text"
                value={form.concentration || ""}
                onChange={handleChange("concentration")}
                placeholder="10 мл/л"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Срок годности</label>
              <input
                type="date"
                value={form.expiration_date || ""}
                onChange={handleChange("expiration_date")}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ссылки на магазины</label>
              <textarea
                value={form.shop_links || ""}
                onChange={handleChange("shop_links")}
                rows={2}
                placeholder="https://shop.ru\nhttps://market.ru"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Инструкция</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Как применять, дозировки</p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="rounded-2xl border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-200"
              >
                Редактировать
              </button>
            </div>
            {form.instruction_text ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{form.instruction_text}</p>
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
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <PlantArticleEditorLazy
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialContent={form.instruction || EMPTY_DOC}
        initialMarkdown={form.instruction_text || ""}
        onSave={handleArticleSave}
        loading={false}
        modalTitle="Инструкция"
      />
    </>
  );
}
