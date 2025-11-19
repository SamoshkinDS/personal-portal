import React from "react";
import Modal from "../../../components/Modal.jsx";

const STATUS_OPTIONS = ["scheduled", "passed", "rejected", "offer_received", "offer_declined"];
const TYPE_OPTIONS = ["Technical", "HR", "Final", "Test Assignment"];

const INITIAL_FORM = {
  company: "",
  position: "",
  interviewDate: "",
  interviewType: "",
  status: "scheduled",
  recruiterName: "",
  recruiterContact: "",
  salaryOffer: "",
  feedback: "",
  notes: "",
};

export default function InterviewModal({ open, interview, onClose, onSave, saving = false }) {
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (interview) {
      setForm({
        company: interview.company || "",
        position: interview.position || "",
        interviewDate: interview.interviewDate
          ? new Date(interview.interviewDate).toISOString().slice(0, 16)
          : "",
        interviewType: interview.interviewType || "",
        status: interview.status || "scheduled",
        recruiterName: interview.recruiterName || "",
        recruiterContact: interview.recruiterContact || "",
        salaryOffer: interview.salaryOffer || "",
        feedback: interview.feedback || "",
        notes: interview.notes || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError("");
  }, [interview, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.company.trim() || !form.position.trim() || !form.interviewDate) {
      setError("Компания, позиция и дата обязательны");
      return;
    }
    const incidentDate = new Date(form.interviewDate);
    if (form.status === "scheduled" && incidentDate <= new Date()) {
      setError("Дата планируемого собеседования должна быть в будущем");
      return;
    }
    if (form.status !== "scheduled" && !form.feedback.trim()) {
      setError("Фидбек обязателен после проведённого интервью");
      return;
    }
    setError("");
    await onSave({
      company: form.company.trim(),
      position: form.position.trim(),
      interviewDate: form.interviewDate,
      interviewType: form.interviewType || null,
      status: form.status,
      recruiterName: form.recruiterName.trim() || null,
      recruiterContact: form.recruiterContact.trim() || null,
      salaryOffer: form.salaryOffer ? Number(form.salaryOffer) : null,
      feedback: form.feedback.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={interview ? "Редактировать интервью" : "Новое интервью"} maxWidth="max-w-3xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Компания*
            <input
              type="text"
              value={form.company}
              onChange={(event) => handleChange("company", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Позиция*
            <input
              type="text"
              value={form.position}
              onChange={(event) => handleChange("position", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Дата и время*
            <input
              type="datetime-local"
              value={form.interviewDate}
              onChange={(event) => handleChange("interviewDate", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Тип
            <select
              value={form.interviewType}
              onChange={(event) => handleChange("interviewType", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            >
              <option value="">Не указан</option>
              {TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Статус*
            <select
              value={form.status}
              onChange={(event) => handleChange("status", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Рекрутер
            <input
              type="text"
              value={form.recruiterName}
              onChange={(event) => handleChange("recruiterName", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Контакт
            <input
              type="text"
              value={form.recruiterContact}
              onChange={(event) => handleChange("recruiterContact", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            ЗП
            <input
              type="number"
              value={form.salaryOffer}
              onChange={(event) => handleChange("salaryOffer", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Фидбек
            <textarea
              rows="3"
              value={form.feedback}
              onChange={(event) => handleChange("feedback", event.target.value)}
              placeholder="Только после проведённого интервью"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-200">
            Заметки
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </label>
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
