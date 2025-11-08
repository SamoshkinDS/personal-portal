// encoding: utf-8
import React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import clsx from "clsx";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}

export default function SubscriptionsList({ items = [], highlightBelowDays = 3 }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
        Активных подписок нет
      </div>
    );
  }
  return (
    <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/80 shadow dark:border-white/5 dark:bg-slate-900/70">
      {items.map((sub) => {
        const critical =
          sub.days_left !== null &&
          sub.days_left !== undefined &&
          sub.days_left <= highlightBelowDays;
        return (
          <div key={sub.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <a
                href={sub.service_url || "#"}
                className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white"
                target="_blank"
                rel="noreferrer"
              >
                {sub.title}
              </a>
              <div className="text-xs text-slate-400">
                Продление: {formatDate(sub.renewal_date)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-semibold text-slate-900 dark:text-white">
                {sub.amount
                  ? `${Number(sub.amount).toLocaleString("ru-RU")} ${sub.currency || "₽"}`
                  : "—"}
              </div>
              <div
                className={clsx("text-xs", critical ? "text-rose-500 font-medium" : "text-slate-400")}
              >
                {sub.days_left !== null && sub.days_left !== undefined
                  ? `Осталось ${sub.days_left} дн.`
                  : "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
