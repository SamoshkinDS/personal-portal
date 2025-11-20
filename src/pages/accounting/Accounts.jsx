// encoding: utf-8
import React from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { accountingApi } from "../../api/accounting.js";

const ACCOUNT_TYPE_LABELS = {
  card: "Банковская карта",
  cash: "Наличные",
  deposit: "Депозит",
  other: "Другой счёт",
};

const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const CURRENCY_PLACEHOLDER = "RUB";

function formatMoney(value, currency = "RUB") {
  const number = Number(value) || 0;
  return `${number.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ${currency}`;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);

  const loadAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingApi.listAccounts();
      setAccounts(response.items || []);
      if (selected) {
        const exists = response.items?.find((acc) => acc.id === selected.id);
        if (!exists) setSelected(null);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.actual_balance || 0), 0);

  const handleCreate = async (payload) => {
    try {
      await accountingApi.createAccount(payload);
      toast.success("Счёт создан");
      loadAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (payload) => {
    if (!selected) return;
    try {
      await accountingApi.updateAccount(selected.id, payload);
      toast.success("Счёт обновлён");
      loadAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Удалить счёт <${account.name}>?`)) return;
    try {
      await accountingApi.deleteAccount(account.id);
      toast.success("Счёт удалён");
      loadAccounts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <PageShell title="Счета">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-slate-500 dark:text-slate-400">Баланс</div>
                <div className="text-3xl font-semibold text-slate-900 dark:text-white">
                  {formatMoney(totalBalance)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
              >
                Новый счёт
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-500">
                Загружаем счета...
              </div>
            )}
            {!loading && accounts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
                Пока нет счетов
              </div>
            )}
            {accounts.map((account) => (
              <div
                key={account.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(account)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(account);
                  }
                }}
                className={`w-full cursor-pointer rounded-3xl border px-4 py-4 text-left transition ${
                  selected?.id === account.id
                    ? "border-indigo-400 bg-indigo-50/70 dark:border-indigo-300 dark:bg-indigo-500/10"
                    : "border-white/10 bg-white/90 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-white/5 dark:bg-slate-900/70"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {ACCOUNT_TYPE_LABELS[account.type] || "Счёт"} • {account.currency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatMoney(account.actual_balance, account.currency)}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      Операций: {account.transactions_count}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Старт: {formatMoney(account.initial_balance, account.currency)}
                  </span>
                  <button
                    type="button"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(account);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
            <div className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Новый счёт</div>
            <AccountForm onSubmit={handleCreate} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
          {selected ? (
            <>
              <div className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Редактирование — {selected.name}
              </div>
              <AccountForm initial={selected} onSubmit={handleUpdate} mode="edit" />
            </>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Выберите счёт слева, чтобы изменить данные или увидеть операции.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function AccountForm({ initial, onSubmit, mode = "create" }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initial?.name || "",
      type: initial?.type || "card",
      currency: initial?.currency || CURRENCY_PLACEHOLDER,
      balance: mode === "create" ? initial?.initial_balance ?? "" : "",
      notes: initial?.notes || "",
    },
  });

  React.useEffect(() => {
    reset({
      name: initial?.name || "",
      type: initial?.type || "card",
      currency: initial?.currency || CURRENCY_PLACEHOLDER,
      balance: "",
      notes: initial?.notes || "",
    });
  }, [initial, reset]);

  const submit = async (values) => {
    await onSubmit?.(values);
    if (mode === "create") {
      reset({
        name: "",
        type: "card",
        currency: CURRENCY_PLACEHOLDER,
        balance: "",
        notes: "",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3 text-sm">
      <Field label="Название">
        <input type="text" {...register("name", { required: true })} />
      </Field>
      <Field label="Тип">
        <select {...register("type")}>
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Валюта">
        <input type="text" className="uppercase" {...register("currency")} />
      </Field>
      <Field label={mode === "create" ? "Начальный баланс" : "Изменить баланс (опционально)"}>
        <input
          type="number"
          step="0.01"
          placeholder={mode === "create" ? "0.00" : "Укажите сумму, если хотите обновить баланс"}
          {...register("balance")}
        />
      </Field>
      <Field label="Заметки">
        <textarea rows={3} {...register("notes")} />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-indigo-500 disabled:opacity-60"
      >
        {mode === "create" ? "Создать" : "Сохранить"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      {React.cloneElement(children, {
        className:
          "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800 dark:text-white",
      })}
    </label>
  );
}
