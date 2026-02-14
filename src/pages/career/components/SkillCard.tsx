import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

export default function SkillCard({ skill, onEdit, onDelete, disabled = false }) {
  const stars = Array.from({ length: 5 })
    .map((_, index) => index + 1)
    .map((value) =>
      value <= (skill.level || 0) ? (
        <AiFillStar key={value} className="text-amber-400" />
      ) : (
        <AiOutlineStar key={value} className="text-slate-300 dark:text-slate-600" />
      )
    );

  return (
    <div className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/90 p-5 shadow transition hover:shadow-lg dark:border-white/5 dark:bg-slate-900/70">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl dark:border-white/10 dark:bg-slate-800">
          {skill.iconUrl ? (
            <img
              src={skill.iconUrl}
              alt={skill.name}
              className="h-10 w-10 rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            skill.name?.[0] || "?"
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{skill.name}</p>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {skill.category || "Без категории"}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-amber-400">{stars}</div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {skill.description || "Описание не указано"}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(skill)}
          disabled={disabled}
          className="rounded-2xl border border-indigo-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
        >
          ✏️ Редактировать
        </button>
        <button
          type="button"
          onClick={() => onDelete(skill)}
          disabled={disabled}
          className="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
        >
          🗑️ Удалить
        </button>
      </div>
    </div>
  );
}
