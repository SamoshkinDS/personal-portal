// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { accountingApi } from "../../api/accounting.js";
import { useAuth } from "../../context/AuthContext.jsx";

const TOGGLES = [
  { key: "show_kpis", label: "Карточки KPI" },
  { key: "show_pie_categories", label: "Диаграмма расходов" },
  { key: "show_upcoming_payments", label: "Ближайшие платежи" },
  { key: "show_subscriptions", label: "Подписки" },
  { key: "show_income_forecast", label: "Прогноз доходов" },
];

export default function AccountingSettingsPage() {
  const { user } = useAuth();
  const canManage = user?.permissions?.includes("accounting:admin") || user?.role === "ALL";

  const [preferences, setPreferences] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingApi.getDashboardPreferences();
      setPreferences(response.preferences);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggle = async (key) => {
    if (!canManage) {
      toast.error("Недостаточно прав");
      return;
    }
    try {
      const payload = { [key]: !preferences[key] };
      const response = await accountingApi.updateDashboardPreferences(payload);
      setPreferences(response.preferences);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <PageShell title="Настройки дашборда">
      <div className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow dark:border-white/5 dark:bg-slate-900/70">
        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}
        {!loading && preferences && (
          <div className="space-y-3">
            {TOGGLES.map((item) => (
              <label
                key={item.key}
                className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold ${
                  canManage ? "cursor-pointer" : "opacity-60"
                }`}
              >
                <span className="text-slate-600 dark:text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={preferences[item.key] !== false}
                  disabled={!canManage}
                  onChange={() => toggle(item.key)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
            {!canManage && (
              <div className="text-xs text-slate-400">
                Для изменения настроек требуется разрешение accounting:admin
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
