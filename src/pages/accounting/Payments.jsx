// encoding: utf-8
import React, { useDeferredValue, useMemo } from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import PaymentsForm from "../../components/accounting/PaymentsForm.jsx";
import Modal from "../../components/Modal.jsx";
import { accountingApi } from "../../api/accounting.js";

const PAYMENT_TYPE_OPTIONS = [
  { value: "", label: "Все типы" },
  { value: "mortgage", label: "Ипотека" },
  { value: "loan", label: "Кредит" },
  { value: "utilities", label: "Коммунальные" },
  { value: "parking_rent", label: "Парковка" },
  { value: "mobile", label: "Связь" },
  { value: "subscription", label: "Подписки" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState([]);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [history, setHistory] = React.useState({ payment: null, items: [] });
  const deferredSearch = useDeferredValue(search);

  const load = React.useCallback(async () => {
    let cancelled = false;
    try {
      setRefreshing(true);
      if (loading) setLoading(true);
      const response = await accountingApi.listPayments(
        typeFilter ? { type: typeFilter } : undefined
      );
      if (!cancelled) setPayments(response.items || []);
    } catch (error) {
      if (!cancelled) toast.error(error.message);
    } finally {
      if (!cancelled) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [loading, typeFilter]);

  React.useEffect(() => {
    const cleanup = load();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filtered = useMemo(
    () => payments.filter((item) => item.title.toLowerCase().includes(deferredSearch.toLowerCase())),
    [payments, deferredSearch]
  );

  const handleSubmit = async (payload) => {
    try {
      if (selected) {
        await accountingApi.updatePayment(selected.id, payload);
        toast.success("Платёж обновлён");
      } else {
        await accountingApi.createPayment(payload);
        toast.success("Платёж создан");
      }
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`Удалить платёж «${payment.title}»?`)) return;
    try {
      await accountingApi.deletePayment(payment.id);
      toast.success("Удалено");
      if (selected?.id === payment.id) setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openHistory = async (payment) => {
    try {
      const response = await accountingApi.getPaymentHistory(payment.id);
      setHistory({ payment, items: response.items || [] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <PageShell
      title="Платежи"
      contentClassName="grid gap-6 lg:grid-cols-[2fr_1fr]"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-white/90 px-4 py-3 shadow dark:border-white/5 dark:bg-slate-900/70">
          <input
            type="search"
            placeholder="Поиск по названию…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
          >
            {PAYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
          >
            Новый платёж
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 shadow dark:border-white/5 dark:bg-slate-900/70">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">След. платёж</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {payment.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {payment.type} · {payment.is_active ? "Активен" : "Выключен"}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-500 dark:text-slate-300">
                    {payment.next_due_date || payment.renewal_date || "—"}
                    {payment.days_left !== null && payment.days_left !== undefined && (
                      <div
                        className={`text-xs ${
                          payment.days_left <= 3 ? "text-rose-500" : "text-slate-400"
                        }`}
                      >
                        Осталось {payment.days_left} дн.
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-900 dark:text-white">
                    {payment.annuity_payment
                      ? `${Number(payment.annuity_payment).toLocaleString("ru-RU")} ${
                          payment.account_currency || "₽"
                        }`
                      : payment.amount
                      ? `${Number(payment.amount).toLocaleString("ru-RU")} ${payment.currency || "₽"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-xs">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(payment)}
                        className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => openHistory(payment)}
                        className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
                      >
                        История
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(payment)}
                        className="rounded-xl border border-transparent px-3 py-1 font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Ничего не найдено
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Загрузка…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
        <div className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-200">
          {selected ? "Редактирование платежа" : "Новый платёж"}
        </div>
        <PaymentsForm
          initial={selected}
          onSubmit={handleSubmit}
          onCancel={() => setSelected(null)}
        />
      </div>

      {history.payment && (
        <Modal
          open
          title={`История — ${history.payment.title}`}
          onClose={() => setHistory({ payment: null, items: [] })}
        >
          <div className="max-h-96 overflow-y-auto text-sm">
            {history.items.length === 0 && (
              <div className="py-4 text-center text-slate-400">Нет записей</div>
            )}
            {history.items.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-white/5 py-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {tx.transaction_date}
                  </div>
                  <div className="text-xs text-slate-400">{tx.description || "—"}</div>
                </div>
                <div className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {tx.amount_account
                    ? `${Number(tx.amount_account).toLocaleString("ru-RU")} ${tx.currency_account || "₽"}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
