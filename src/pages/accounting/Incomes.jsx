// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageShell from "../../components/PageShell.jsx";
import IncomeForm from "../../components/accounting/IncomeForm.jsx";
import { accountingApi } from "../../api/accounting.js";

const PERIOD_LABELS = {
  month: "Месяц",
  year: "Год",
};

export default function IncomesPage() {
  const [incomes, setIncomes] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [forecastPeriod, setForecastPeriod] = React.useState("month");
  const [forecast, setForecast] = React.useState({ items: [], total: 0 });
  const [loadingForecast, setLoadingForecast] = React.useState(true);
  const [categories, setCategories] = React.useState([]);

  const incomeCategories = React.useMemo(
    () => categories.filter((cat) => cat.type === "income"),
    [categories]
  );

  const loadIncomes = React.useCallback(async () => {
    try {
      const response = await accountingApi.listIncomes();
      setIncomes(response.items || []);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const loadForecast = React.useCallback(
    async (period) => {
      try {
        setLoadingForecast(true);
        const response = await accountingApi.getIncomeForecast(period);
        setForecast(response);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingForecast(false);
      }
    },
    []
  );

  React.useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  React.useEffect(() => {
    loadForecast(forecastPeriod);
  }, [forecastPeriod, loadForecast]);

  React.useEffect(() => {
    accountingApi
      .listCategories()
      .then((res) => setCategories(res.items || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (payload) => {
    try {
      if (selected) {
        await accountingApi.updateIncome(selected.id, payload);
        toast.success("Доход обновлён");
      } else {
        await accountingApi.createIncome(payload);
        toast.success("Доход добавлен");
      }
      setSelected(null);
      loadIncomes();
      loadForecast(forecastPeriod);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (income) => {
    if (!window.confirm(`Удалить источник «${income.source_name}»?`)) return;
    try {
      await accountingApi.deleteIncome(income.id);
      toast.success("Удалено");
      if (selected?.id === income.id) setSelected(null);
      loadIncomes();
      loadForecast(forecastPeriod);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <PageShell title="Плановые доходы">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Источники дохода
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Всего: {incomes.length}
              </div>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 p-1 text-xs font-semibold dark:border-white/10">
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForecastPeriod(value)}
                  className={`rounded-2xl px-3 py-1 ${
                    forecastPeriod === value
                      ? "bg-indigo-500 text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/5 rounded-3xl border border-white/10 bg-white/80 shadow dark:border-white/5 dark:bg-slate-900/60">
            {incomes.map((income) => (
              <div key={income.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{income.source_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {income.amount?.toLocaleString("ru-RU")} {income.currency} ·{" "}
                    {income.periodicity === "monthly"
                      ? "Ежемесячно"
                      : income.periodicity === "quarterly"
                      ? "Ежеквартально"
                      : `Каждые ${income.n_days} дн.`}
                    {income.category_name ? ` · ${income.category_name}` : ""}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelected(income)}
                    className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(income)}
                    className="rounded-xl border border-transparent px-3 py-1 font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {!incomes.length && (
              <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Источники не добавлены
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
          <div className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-200">
            {selected ? `Редактирование — ${selected.source_name}` : "Новый доход"}
          </div>
          <IncomeForm
            initial={selected}
            categories={incomeCategories}
            onSubmit={handleSubmit}
            onCancel={() => setSelected(null)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
        <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
          Прогноз поступлений
        </div>
        <IncomeForecast items={forecast.items || []} loading={loadingForecast} />
      </div>
    </PageShell>
  );
}

function IncomeForecast({ items, loading }) {
  if (loading) {
    return <div className="h-48 text-center text-sm text-slate-500">Загрузка прогноза…</div>;
  }
  if (!items.length) {
    return <div className="text-sm text-slate-500">Нет данных для прогноза</div>;
  }
  return (
    <div className="h-48 text-slate-900 dark:text-white">
      <ResponsiveContainer>
        <AreaChart data={items}>
          <defs>
            <linearGradient id="incomeForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString("ru-RU")} ₽`} />
          <Area type="basis" dataKey="amount" stroke="#f97316" fill="url(#incomeForecast)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
