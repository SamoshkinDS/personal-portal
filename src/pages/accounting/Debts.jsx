// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { accountingApi } from "../../api/accounting.js";

const DIRECTIONS = [
  { value: "borrowed", label: "Мне дали (я возвращаю)" },
  { value: "lent", label: "Я дал (мне возвращают)" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const toDay = (value) => {
  const date = new Date(value || new Date());
  if (Number.isNaN(date.getTime())) return new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const daysBetween = (from, to) => {
  const a = toDay(from).getTime();
  const b = toDay(to).getTime();
  return Math.max(0, Math.round((b - a) / DAY_MS));
};

function computePaymentPreview(debt, payments, principalValue, paymentDate) {
  const rate = Number(debt?.interest_rate_apy) || 0;
  const asOf = paymentDate ? toDay(paymentDate) : toDay(new Date());
  const sorted = [...(payments || [])].sort(
    (a, b) => new Date(a.payment_date || a.created_at) - new Date(b.payment_date || b.created_at)
  );
  let outstanding = Number(debt?.principal_amount) || 0;
  let accrued = 0;
  let interestPaid = 0;
  let cursor = debt?.start_date ? toDay(debt.start_date) : toDay(new Date());
  for (const payment of sorted) {
    const payDate = toDay(payment.payment_date || payment.created_at || asOf);
    const delta = daysBetween(cursor, payDate);
    if (rate > 0 && outstanding > 0 && delta > 0) {
      accrued += outstanding * (rate / 100) * (delta / 365);
    }
    outstanding = Math.max(0, outstanding - (Number(payment.principal_paid) || 0));
    interestPaid += Number(payment.interest_paid) || 0;
    cursor = payDate;
  }
  const tail = daysBetween(cursor, asOf);
  if (rate > 0 && outstanding > 0 && tail > 0) {
    accrued += outstanding * (rate / 100) * (tail / 365);
  }
  const interestDue = Math.max(0, Math.round((accrued - interestPaid) * 100) / 100);
  const principalInput = Math.max(0, Number(principalValue) || 0);
  const principalPaid = Math.min(principalInput, outstanding);
  const interestComponent = rate > 0 ? interestDue : 0;
  const total = Math.round((principalPaid + interestComponent) * 100) / 100;
  const remainingAfter = Math.max(0, Math.round((outstanding - principalPaid) * 100) / 100);
  return {
    principalPaid,
    interestComponent,
    total,
    outstanding,
    interestDue,
    remainingAfter,
  };
}

function DebtForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = React.useState("");
  const [direction, setDirection] = React.useState("borrowed");
  const [counterparty, setCounterparty] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [principal, setPrincipal] = React.useState("");
  const [currency, setCurrency] = React.useState("RUB");
  const [interestRate, setInterestRate] = React.useState("");
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isClosed, setIsClosed] = React.useState(false);

  React.useEffect(() => {
    if (!initial) {
      setTitle("");
      setDirection("borrowed");
      setCounterparty("");
      setBankName("");
      setPrincipal("");
      setCurrency("RUB");
      setInterestRate("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setDescription("");
      setIsClosed(false);
      return;
    }
    setTitle(initial.title || "");
    setDirection(initial.direction || "borrowed");
    setCounterparty(initial.counterparty || "");
    setBankName(initial.bank_name || "");
    setPrincipal(initial.principal_amount ?? "");
    setCurrency(initial.currency || "RUB");
    setInterestRate(
      initial.interest_rate_apy === null || initial.interest_rate_apy === undefined
        ? ""
        : initial.interest_rate_apy
    );
    setStartDate(initial.start_date || new Date().toISOString().slice(0, 10));
    setDueDate(initial.due_date || "");
    setDescription(initial.description || "");
    setIsClosed(Boolean(initial.is_closed));
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      direction,
      counterparty,
      bank_name: bankName,
      principal_amount: principal ? Number(principal) : "",
      currency,
      interest_rate_apy: interestRate === "" ? null : Number(interestRate),
      start_date: startDate,
      due_date: dueDate || null,
      description,
      is_closed: isClosed,
    });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {initial ? "Редактирование долга" : "Новый долг"}
        </div>
        {initial && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
          >
            Очистить
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Название</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Тип</span>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          >
            {DIRECTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">
            {direction === "borrowed" ? "Кому я должен" : "Кто должен мне"}
          </span>
          <input
            required
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Банк / куда переводить</span>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
            placeholder="Напр. Тинькофф, Сбер"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Сумма</span>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Валюта</span>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase dark:border-white/10 dark:bg-slate-900/50"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-500 dark:text-slate-300">Ставка, % годовых</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="0 = без процентов"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-300">Старт</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500 dark:text-slate-300">Дедлайн</span>
            <input
              type="date"
              value={dueDate || ""}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
            />
          </label>
        </div>
      </div>
      <label className="text-sm">
        <span className="text-slate-500 dark:text-slate-300">Комментарий</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
          rows={3}
          placeholder="Условия, контакты, доп. заметки"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
        <input
          type="checkbox"
          checked={isClosed}
          onChange={(e) => setIsClosed(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900"
        />
        Закрыт / погашен
      </label>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          Сохранить
        </button>
        {initial && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

export default function DebtsPage() {
  const [debts, setDebts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [directionFilter, setDirectionFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [paymentTarget, setPaymentTarget] = React.useState(null);

  const load = React.useCallback(async () => {
    let cancelled = false;
    try {
      setRefreshing(true);
      if (loading) setLoading(true);
      const response = await accountingApi.listDebts();
      if (!cancelled) {
        setDebts(response.items || []);
      }
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
  }, [loading]);

  React.useEffect(() => {
    const cleanup = load();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [load]);

  const filteredDebts = React.useMemo(() => {
    return debts.filter((debt) => {
      if (directionFilter && debt.direction !== directionFilter) return false;
      const term = search.toLowerCase();
      if (!term) return true;
      return (
        (debt.title || "").toLowerCase().includes(term) ||
        (debt.counterparty || "").toLowerCase().includes(term) ||
        (debt.bank_name || "").toLowerCase().includes(term)
      );
    });
  }, [debts, directionFilter, search]);

  const handleSubmit = async (payload) => {
    try {
      if (selected) {
        await accountingApi.updateDebt(selected.id, payload);
        toast.success("Долг обновлён");
      } else {
        await accountingApi.createDebt(payload);
        toast.success("Долг добавлен");
      }
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (debt) => {
    if (!window.confirm(`Удалить долг «${debt.title}»?`)) return;
    try {
      await accountingApi.deleteDebt(debt.id);
      toast.success("Удалено");
      if (selected?.id === debt.id) setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openPayment = async (debt) => {
    try {
      setPaymentTarget({ loading: true, debtId: debt.id });
      const response = await accountingApi.getDebt(debt.id);
      setPaymentTarget({
        debt: response.debt,
        payments: response.payments || [],
        principal: response.debt?.outstanding_principal || "",
        paymentDate: new Date().toISOString().slice(0, 10),
        comment: "",
      });
    } catch (error) {
      toast.error(error.message);
      setPaymentTarget(null);
    }
  };

  const submitPayment = async () => {
    if (!paymentTarget?.debt) return;
    try {
      await accountingApi.addDebtPayment(paymentTarget.debt.id, {
        principal_amount: Number(paymentTarget.principal),
        payment_date: paymentTarget.paymentDate,
        comment: paymentTarget.comment,
      });
      toast.success("Платёж сохранён");
      setPaymentTarget(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const paymentPreview = React.useMemo(() => {
    if (!paymentTarget?.debt) return null;
    return computePaymentPreview(
      paymentTarget.debt,
      paymentTarget.payments || [],
      paymentTarget.principal,
      paymentTarget.paymentDate
    );
  }, [paymentTarget]);

  return (
    <>
      <PageShell
        title="Долги"
        contentClassName="grid gap-6 lg:grid-cols-[2fr_1fr]"
        actions={
          <div className="text-xs text-slate-400">{refreshing ? "Обновление..." : ""}</div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-white/90 px-4 py-3 shadow dark:border-white/5 dark:bg-slate-900/70">
            <input
              type="search"
              placeholder="Поиск по названию, человеку, банку"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
            />
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
            >
              <option value="">Все</option>
              {DIRECTIONS.map((opt) => (
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
              Новый долг
            </button>
          </div>

          <div className="grid gap-3">
            {filteredDebts.map((debt) => (
              <div
                key={debt.id}
                className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {debt.title}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          debt.direction === "borrowed"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                        }`}
                      >
                        {debt.direction === "borrowed" ? "Я должен" : "Мне должны"}
                      </span>
                      {debt.is_closed && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          Закрыт
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {debt.counterparty}
                      {debt.bank_name ? ` · ${debt.bank_name}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Остаток:{" "}
                    {debt.total_due
                      ? `${debt.total_due.toLocaleString("ru-RU")} ${debt.currency || "₽"}`
                      : `${(debt.outstanding_principal || 0).toLocaleString("ru-RU")} ${
                          debt.currency || "₽"
                        }`}
                    <div className="text-xs font-normal text-slate-400">
                      Тело {debt.outstanding_principal?.toLocaleString("ru-RU")} + проценты{" "}
                      {debt.interest_due?.toLocaleString("ru-RU")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">
                    <div className="text-slate-400">Старт</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {debt.start_date || "-"}
                    </div>
                    <div className="text-slate-400">
                      Дедлайн: {debt.due_date || "не задан"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">
                    <div className="text-slate-400">Последний платёж</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {debt.last_payment_date || "нет"}
                    </div>
                    <div className="text-slate-400">
                      Выплачено: {debt.total_paid?.toLocaleString("ru-RU")} {debt.currency || "₽"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">
                    <div className="text-slate-400">Проценты</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {debt.interest_rate_apy ? `${debt.interest_rate_apy}% годовых` : "Без %"}
                    </div>
                    <div className="text-slate-400">
                      Накоплено: {debt.accrued_interest?.toLocaleString("ru-RU")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPayment(debt)}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
                  >
                    {debt.direction === "borrowed" ? "Вернуть" : "Получить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(debt)}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(debt)}
                    className="rounded-xl border border-transparent px-3 py-1 text-sm font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {!filteredDebts.length && !loading && (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Пока нет долгов
              </div>
            )}
            {loading && (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Загрузка...
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
          <DebtForm initial={selected} onSubmit={handleSubmit} onCancel={() => setSelected(null)} />
        </div>
      </PageShell>

      {paymentTarget?.debt && (
        <Modal
          open
          onClose={() => setPaymentTarget(null)}
          title={paymentTarget.debt.direction === "borrowed" ? "Возврат долга" : "Получение долга"}
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
              <div className="font-semibold text-slate-900 dark:text-white">
                {paymentTarget.debt.title}
              </div>
              <div className="text-xs text-slate-400">
                Остаток: {paymentTarget.debt.total_due?.toLocaleString("ru-RU")}{" "}
                {paymentTarget.debt.currency || "₽"}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-500 dark:text-slate-300">
                  {paymentTarget.debt.direction === "borrowed"
                    ? "Сколько вернуть (тело)"
                    : "Сколько принять (тело)"}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentTarget.principal}
                  onChange={(e) =>
                    setPaymentTarget((prev) => ({ ...prev, principal: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500 dark:text-slate-300">Дата платежа</span>
                <input
                  type="date"
                  value={paymentTarget.paymentDate}
                  onChange={(e) =>
                    setPaymentTarget((prev) => ({ ...prev, paymentDate: e.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
                />
              </label>
            </div>
            <label className="text-sm">
              <span className="text-slate-500 dark:text-slate-300">Комментарий</span>
              <textarea
                rows={2}
                value={paymentTarget.comment}
                onChange={(e) =>
                  setPaymentTarget((prev) => ({ ...prev, comment: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/50"
              />
            </label>
            {paymentPreview && (
              <div className="rounded-2xl bg-indigo-50 p-3 text-xs text-indigo-800 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-100">
                <div className="font-semibold">
                  К переводу сейчас: {paymentPreview.total.toLocaleString("ru-RU")}{" "}
                  {paymentTarget.debt.currency || "₽"}
                </div>
                <div className="text-indigo-700 dark:text-indigo-200">
                  Тело: {paymentPreview.principalPaid.toLocaleString("ru-RU")} · Проценты:{" "}
                  {paymentPreview.interestComponent.toLocaleString("ru-RU")}
                </div>
                <div className="text-indigo-700 dark:text-indigo-200">
                  Останется после платежа: {paymentPreview.remainingAfter.toLocaleString("ru-RU")}{" "}
                  {paymentTarget.debt.currency || "₽"}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentTarget(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitPayment}
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Сохранить платеж
              </button>
            </div>
            <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/70 text-sm shadow dark:border-white/5 dark:bg-slate-900/70">
              {(paymentTarget.payments || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {p.payment_date}
                    </div>
                    <div className="text-xs text-slate-400">{p.comment || "-"}</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                    {p.amount_total?.toLocaleString("ru-RU")} {paymentTarget.debt.currency || "₽"}
                    <div className="text-xs text-slate-400">
                      Тело {p.principal_paid?.toLocaleString("ru-RU")}, проценты{" "}
                      {p.interest_paid?.toLocaleString("ru-RU")}
                    </div>
                  </div>
                </div>
              ))}
              {!paymentTarget.payments?.length && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">Нет платежей</div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
