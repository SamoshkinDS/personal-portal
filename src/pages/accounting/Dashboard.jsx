// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import PageShell from "../../components/PageShell.jsx";
import KPICard from "../../components/accounting/KPICard.jsx";
import PieExpensesByCategory from "../../components/accounting/PieExpensesByCategory.jsx";
import UpcomingPaymentsList from "../../components/accounting/UpcomingPaymentsList.jsx";
import SubscriptionsList from "../../components/accounting/SubscriptionsList.jsx";
import { accountingApi } from "../../api/accounting.js";

export default function AccountingDashboard() {
  const [month, setMonth] = React.useState(format(new Date(), "yyyy-MM"));
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingApi.getDashboard(month);
      setData(response);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  React.useEffect(() => {
    load();
  }, [load]);

  const preferences = data?.preferences || {};
  const kpis = data?.kpis || { incomes: 0, expenses: 0, balance: 0 };
  const accountsSummary = data?.accounts_summary;

  return (
    <PageShell title="Финансы — дашборд">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Период:
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="ml-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40"
            />
          </label>
          <button
            type="button"
            onClick={load}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-500"
          >
            Обновить
          </button>
        </div>

        {preferences.show_kpis !== false && (
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard title="Доходы за месяц" value={kpis.incomes} currency="₽" hint="По данным транзакций" />
            <KPICard title="Расходы за месяц" value={kpis.expenses} currency="₽" hint="Фактические списания" />
            <KPICard title="Баланс месяца" value={kpis.balance} currency="₽" hint="Доходы − Расходы" />
            <KPICard
              title="Общий баланс"
              value={accountsSummary?.total_balance || 0}
              currency="₽"
              hint="Сумма по всем счетам"
            />
          </div>
        )}

        <AccountsSummary summary={accountsSummary} />

        <div className="grid gap-6 lg:grid-cols-5">
          {preferences.show_pie_categories !== false && (
            <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70 lg:col-span-3">
              <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
                Расходы по категориям
              </div>
              <PieExpensesByCategory data={data?.pie_by_category || []} />
            </div>
          )}
          {preferences.show_income_forecast !== false && (
            <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70 lg:col-span-2">
              <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
                Прогноз поступлений (30 дней)
              </div>
              <IncomeForecastChart items={data?.income_forecast?.items || []} loading={loading} />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {preferences.show_upcoming_payments !== false && (
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
                Ближайшие платежи (7 дней)
              </div>
              <UpcomingPaymentsList items={data?.upcoming_payments || []} />
            </div>
          )}
          {preferences.show_subscriptions !== false && (
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
                Подписки
              </div>
              <SubscriptionsList items={data?.subscriptions || []} highlightBelowDays={3} />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function AccountsSummary({ summary }) {
  if (!summary) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-200">Счета</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">
            {formatCurrency(summary.total_balance)}
          </div>
        </div>
        <Link
          to="/accounting/accounts"
          className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
        >
          Управлять
        </Link>
      </div>
      {summary.items?.length ? (
        <div className="space-y-2">
          {summary.items.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/80 px-3 py-2 text-sm dark:border-white/5 dark:bg-slate-900/60"
            >
              <div>
                <div className="font-semibold text-slate-700 dark:text-white">{account.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{account.currency}</div>
              </div>
              <div className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                {formatCurrency(account.actual_balance, account.currency)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Добавьте счёт, чтобы видеть общий баланс.
        </div>
      )}
    </div>
  );
}

function IncomeForecastChart({ items, loading }) {
  if (loading) {
    return <div className="h-48 text-center text-sm text-slate-500">Загрузка…</div>;
  }
  if (!items.length) {
    return <div className="text-sm text-slate-500">Нет данных для прогноза</div>;
  }
  return (
    <div className="h-48 text-slate-900 dark:text-white">
      <ResponsiveContainer>
        <AreaChart data={items}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${Number(value).toLocaleString("ru-RU")} ₽`} />
          <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#incomeGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(value, currency = "₽") {
  const number = Number(value) || 0;
  return `${number.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ${currency}`;
}
