import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const STATUS_STYLES = {
  planned: {
    label: "Запланировано",
    className:
      "border-purple-200 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200 dark:border-purple-400/30",
  },
  in_progress: {
    label: "В процессе",
    className:
      "border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-400/30",
  },
  completed: {
    label: "Завершено",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-400/30",
  },
  abandoned: {
    label: "Отказано",
    className:
      "border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-400/30",
  },
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

export default function CourseCard({
  course,
  skillsMap = new Map(),
  onEdit,
  onDelete,
  onCertificate,
  disabled = false,
}) {
  const statusInfo = STATUS_STYLES[course.status] || STATUS_STYLES.planned;

  const ratingStars =
    course.status === "completed" && Number.isFinite(course.rating)
      ? Array.from({ length: 5 }, (_, index) =>
          index < Number(course.rating) ? (
            <AiFillStar key={index} className="text-amber-400" />
          ) : (
            <AiOutlineStar key={index} className="text-slate-300 dark:text-slate-600" />
          )
        )
      : null;

  const skillNames = (course.skillIds || [])
    .map((id) => skillsMap.get(id)?.name)
    .filter(Boolean);

  const progress = Number(course.progressPercent) || 0;

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/90 p-5 shadow transition hover:shadow-lg dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{course.platform || "Платформа не указана"}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Начало</div>
          <div className="font-semibold text-slate-900 dark:text-white">{formatDate(course.startDate)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Завершение</div>
          <div className="font-semibold text-slate-900 dark:text-white">{formatDate(course.completionDate)}</div>
        </div>
      </div>

      {course.status === "in_progress" && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>Прогресс</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      {ratingStars && <div className="mt-3 flex gap-0.5 text-base">{ratingStars}</div>}

      {skillNames.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skillNames.map((name) => (
            <span
              key={name}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {course.notes && <div className="mt-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">{course.notes}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {course.certificateUrl && (
          <a
            href={course.certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
          >
            Посмотреть
          </a>
        )}
        <button
          type="button"
          onClick={() => onCertificate(course)}
          disabled={disabled}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-600 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          Сертификат
        </button>
        <button
          type="button"
          onClick={() => onEdit(course)}
          disabled={disabled}
          className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => onDelete(course)}
          disabled={disabled}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
