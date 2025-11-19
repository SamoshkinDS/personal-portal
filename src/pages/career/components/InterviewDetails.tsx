import React from "react";
import Modal from "../../../components/Modal.jsx";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function InterviewDetails({ open, interview, onClose }) {
  const copyContact = () => {
    if (!interview?.recruiterContact) return;
    navigator.clipboard.writeText(interview.recruiterContact).then(() => {
      window.alert("Контакт скопирован");
    });
  };

  if (!interview) return null;

  return (
    <Modal open={open} onClose={onClose} title="Детали собеседования" maxWidth="max-w-lg">
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          <strong>Компания:</strong> {interview.company || "—"}
        </p>
        <p>
          <strong>Позиция:</strong> {interview.position || "—"}
        </p>
        <p>
          <strong>Дата/время:</strong> {formatDate(interview.interviewDate)}
        </p>
        <p>
          <strong>Тип:</strong> {interview.interviewType || "—"}
        </p>
        <p>
          <strong>Статус:</strong> {interview.status || "—"}
        </p>
        <p className="flex items-center gap-2">
          <strong>Рекрутер:</strong> {interview.recruiterName || "—"}
          {interview.recruiterContact && (
            <button
              type="button"
              onClick={copyContact}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:text-slate-200"
            >
              Копировать
            </button>
          )}
        </p>
        <p>
          <strong>Контакт:</strong> {interview.recruiterContact || "—"}
        </p>
        <p>
          <strong>ЗП:</strong>{" "}
          {interview.salaryOffer != null ? Number(interview.salaryOffer).toLocaleString("ru-RU") : "—"}
        </p>
        <p>
          <strong>Фидбек:</strong> {interview.feedback || "—"}
        </p>
        <p>
          <strong>Заметки:</strong> {interview.notes || "—"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Создано: {interview.createdAt ? new Date(interview.createdAt).toLocaleString("ru-RU") : "—"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Обновлено: {interview.updatedAt ? new Date(interview.updatedAt).toLocaleString("ru-RU") : "—"}
        </p>
      </div>
    </Modal>
  );
}
