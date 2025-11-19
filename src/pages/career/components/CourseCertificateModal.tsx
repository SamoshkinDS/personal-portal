import React from "react";
import toast from "react-hot-toast";
import Modal from "../../../components/Modal.jsx";
import { careerApi } from "../../../api/career.js";

export default function CourseCertificateModal({ open, course, onClose, onSave, saving = false }) {
  const [link, setLink] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setLink(course?.certificateUrl || "");
    setError("");
  }, [course, open]);

  const handleFileChange = async (event) => {
    if (!course) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await careerApi.uploadCourseCertificateFile(course.id, file);
      if (result.url) {
        setLink(result.url);
        toast.success("Файл успешно загружен");
      }
    } catch (err) {
      toast.error(err?.message || "Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!course) return;
    if (!link.trim()) {
      setError("Укажите ссылку или загрузите файл");
      return;
    }
    setError("");
    await onSave({ certificateUrl: link.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} title={course ? `Сертификат — ${course.title}` : "Сертификат"} maxWidth="max-w-2xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Укажите публичную ссылку на сертификат или загрузите файл (PDF, JPG, PNG, до 10 МБ).
        </p>
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
          Ссылка на сертификат *
          <input
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
          Загрузить файл
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-2 w-full text-xs text-slate-500 dark:text-slate-400"
          />
        </label>
        {uploading && <p className="text-xs text-slate-500 dark:text-slate-400">Загрузка...</p>}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-300"
          >
            Открыть текущий сертификат
          </a>
        )}
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
