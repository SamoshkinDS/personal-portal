// encoding: utf-8
import React from "react";
import clsx from "clsx";
import InlineAmountEditor from "./InlineAmountEditor.jsx";

export default function TransactionsTable({
  items = [],
  loading = false,
  categories = [],
  accounts = [],
  onEdit,
  onDelete,
}) {
  const handleDateChange = (id, value) => onEdit?.(id, { transaction_date: value });
  const handleCategoryChange = (id, value) => onEdit?.(id, { category_id: value || null });
  const handleAccountChange = (id, value) => onEdit?.(id, { account_id: value || null });

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
        {loading ? "Загрузка…" : "Транзакции не найдены"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/90 shadow dark:border-white/5 dark:bg-slate-900/70">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Дата</th>
            <th className="px-4 py-3">Описание</th>
            <th className="px-4 py-3">Категория</th>
            <th className="px-4 py-3">Счёт</th>
            <th className="px-4 py-3 text-right">Сумма</th>
            <th className="px-4 py-3">MCC</th>
            <th className="px-4 py-3">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((tx) => (
            <tr key={tx.id} className="text-slate-900 dark:text-slate-100">
              <td className="px-4 py-3 align-top">
                <input
                  type="date"
                  defaultValue={tx.transaction_date}
                  onBlur={(e) => handleDateChange(tx.id, e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-800"
                />
              </td>
              <td className="px-4 py-3 align-top">
                <div className="text-sm font-semibold">{tx.description || "—"}</div>
                <div className="text-xs text-slate-400">
                  {tx.payment_title ? `Платёж: ${tx.payment_title}` : ""}
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                <select
                  defaultValue={tx.category_id || ""}
                  onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                  className="w-44 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-800"
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 align-top">
                <select
                  defaultValue={tx.account_id || ""}
                  onChange={(e) => handleAccountChange(tx.id, e.target.value)}
                  className="w-40 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-800"
                >
                  <option value="">Без счёта</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-right align-top">
                <InlineAmountEditor
                  value={tx.amount_account}
                  currency={tx.currency_account || "₽"}
                  onSave={(patch) => onEdit?.(tx.id, patch)}
                />
                <div
                  className={clsx(
                    "text-xs font-semibold",
                    tx.is_income ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {tx.is_income ? "Доход" : "Расход"}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-xs text-slate-500 dark:text-slate-400">
                {tx.mcc || "—"}
              </td>
              <td className="px-4 py-3 align-top text-right">
                <button
                  type="button"
                  onClick={() => onDelete?.(tx.id)}
                  className="rounded-xl border border-transparent px-3 py-1 text-xs font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="px-4 py-2 text-center text-xs text-slate-500">Обновление данных…</div>
      )}
    </div>
  );
}
