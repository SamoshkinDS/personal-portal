// encoding: utf-8
import React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM", { locale: ru });
  } catch {
    return dateStr;
  }
}

export default function UpcomingPaymentsList({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
        Нет платежей на ближайшие 7 дней
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((payment) => {
        const critical =
          payment.days_left !== null && payment.days_left !== undefined && payment.days_left <= 2;
        return (
          <div
            key={payment.id}
            className={`flex items-center justify-between rounded-3xl border border-white/10 bg-white/80 px-4 py-3 text-sm shadow dark:border-white/5 dark:bg-slate-900/70 ${
              critical ? "ring-1 ring-rose-400/50" : ""
            }`}
          >
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{payment.title}</div>
              <div className="text-xs uppercase text-slate-400">
                {payment.type} · {formatDate(payment.next_due_date)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-semibold text-slate-900 dark:text-white">
                {payment.annuity_payment
                  ? `${payment.annuity_payment.toLocaleString("ru-RU")} ${payment.account_currency || "₽"}`
                  : payment.amount
                  ? `${Number(payment.amount).toLocaleString("ru-RU")} ${payment.currency || "₽"}`
                  : "—"}
              </div>
              <div className={`text-xs ${critical ? "text-rose-500" : "text-slate-400"}`}>
                {payment.days_left !== null && payment.days_left !== undefined
                  ? `Через ${payment.days_left} дн.`
                  : "Дата не указана"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
