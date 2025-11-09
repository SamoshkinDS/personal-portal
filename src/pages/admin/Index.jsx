// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell.jsx";
import ServerStatCard from "../../components/ServerStatCard.jsx";
import { getServerStats } from "../../utils/systemInfo.js";
import { apiAuthFetch } from "../../utils/api.js";

const cards = [
  { id: 'users', title: 'Пользователи', desc: 'Управление доступами и блокировками', to: '/admin/users', color: 'from-indigo-500 to-blue-600' },
  { id: 'content', title: 'Контент портала', desc: 'Статьи, ссылки и посты', to: '/admin/content', color: 'from-emerald-500 to-teal-600' },
  { id: 'logs', title: 'Журнал действий', desc: 'История действий и событий', to: '/admin/logs', color: 'from-amber-500 to-orange-600' },
];

const quickDeployActions = [
  {
    key: "git-pull",
    label: "Git pull",
    tooltip: "Быстро подтянуть изменения с origin/main",
    accent: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v14" />
        <path d="m8 13 4 4 4-4" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="21" r="1.5" />
      </svg>
    ),
  },
  {
    key: "backend-update",
    label: "Backend",
    tooltip: "Пересобрать backend и перезапустить сервис",
    accent: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="8" rx="2" />
        <rect x="3" y="13" width="18" height="8" rx="2" />
        <path d="M7 17h0.01" />
        <path d="M11 17h0.01" />
        <path d="M15 17h0.01" />
      </svg>
    ),
  },
  {
    key: "frontend-build",
    label: "Frontend",
    tooltip: "Собрать витрину и задеплоить",
    accent: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18" />
        <path d="M3 17h18" />
        <path d="M6 3v4" />
        <path d="M18 3v4" />
        <path d="M6 17v4" />
        <path d="M18 17v4" />
        <path d="m9 10 3 3 3-3" />
      </svg>
    ),
  },
  {
    key: "deploy-full",
    label: "Deploy",
    tooltip: "Запустить общий скрипт deploy.sh",
    accent: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0c0 4-4 8-8 8s-8-4-8-8Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
];

export default function AdminHome() {
  const [stats, setStats] = React.useState(null);
  const [runningAction, setRunningAction] = React.useState(null);
  const [actionResult, setActionResult] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    getServerStats().then((data) => { if (mounted) setStats(data); });
    const id = setInterval(() => { getServerStats().then((data) => mounted && setStats(data)); }, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const spinnerIcon = (
    <svg className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle className="opacity-30" cx="12" cy="12" r="9" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );

  const runQuickAction = React.useCallback(
    async (action) => {
      if (!action) return;
      setRunningAction(action.key);
      setActionResult(null);
      try {
        const response = await apiAuthFetch(`/api/actions/${action.key}/run`, { method: "POST" });
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }
        if (!response.ok || payload?.ok === false) {
          const message = payload?.error || `Не получилось выполнить «${action.label}»`;
          throw new Error(message);
        }
        setActionResult({
          type: "success",
          label: action.label,
          message: payload?.message || `Команда «${action.label}» выполнена`,
          stdout: payload?.stdout || "",
          stderr: payload?.stderr || "",
        });
        toast.success(`Команда «${action.label}» выполнена`);
      } catch (error) {
        setActionResult({
          type: "error",
          label: action.label,
          message: error?.message || `Ошибка при выполнении «${action.label}»`,
          stdout: error?.stdout || "",
          stderr: error?.stderr || "",
        });
        toast.error(error?.message || "Команда завершилась ошибкой");
      } finally {
        setRunningAction(null);
      }
    },
    []
  );

  return (
    <PageShell title="Админ-панель" contentClassName="p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.id} to={c.to} className="group block">
            <div className={`rounded-3xl p-6 text-white shadow-xl transition-transform duration-200 group-hover:-translate-y-1 bg-gradient-to-br ${c.color}`}>
              <div className="text-2xl font-bold">{c.title}</div>
              <div className="mt-2 text-white/90">{c.desc}</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-sm">
                Перейти
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Метрики сервера + быстрые действия */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ServerStatCard title="CPU" value={stats ? stats.cpu : "—"} unit="%" percent={stats ? stats.cpu : 0} color="#f59e0b" subtitle="Текущее среднее использование" />
            <ServerStatCard title="Диск" value={stats ? stats.disk : "—"} unit="%" percent={stats ? stats.disk : 0} color="#10b981" subtitle="Нагрузка на хранилище" />
            <ServerStatCard title="Входящий трафик" value={stats ? stats.bandwidth?.in : "—"} unit="Мбит/с" percent={stats ? Math.min(100, (stats.bandwidth?.in || 0) / 100) : 0} color="#22c55e" subtitle="Канал data-in" />
            <ServerStatCard title="Исходящий трафик" value={stats ? stats.bandwidth?.out : "—"} unit="Мбит/с" percent={stats ? Math.min(100, (stats.bandwidth?.out || 0) / 100) : 0} color="#3b82f6" subtitle={stats ? `Uptime: ${stats.uptime}` : "Канал data-out"} />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Быстрые действия</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Запускай выкладки и проверяй логи инфраструктуры прямо отсюда.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {quickDeployActions.map((action) => {
                const isRunning = runningAction === action.key;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => runQuickAction(action)}
                    disabled={isRunning}
                    title={action.tooltip}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-3 py-4 text-sm font-medium text-gray-600 transition hover:border-blue-400/60 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 dark:border-gray-700 dark:bg-slate-800/85 dark:text-gray-200 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.accent} ${isRunning ? "ring-2 ring-blue-400/40" : ""}`}>
                      {isRunning ? spinnerIcon : action.icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {actionResult && (
            <div
              className={`rounded-3xl border p-6 text-sm ${
                actionResult.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-red-200 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{actionResult.label}</div>
                <button type="button" onClick={() => setActionResult(null)} className="text-xs uppercase tracking-wide text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300">
                  Сбросить
                </button>
              </div>
              <p className="mt-2 text-sm">{actionResult.message}</p>
              {actionResult.stdout && (
                <pre className="mt-3 max-h-32 overflow-y-auto rounded-xl bg-slate-900/90 p-3 text-xs text-slate-100">{actionResult.stdout}</pre>
              )}
              {actionResult.stderr && (
                <pre className="mt-3 max-h-32 overflow-y-auto rounded-xl bg-red-900/50 p-3 text-xs text-red-100">{actionResult.stderr}</pre>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
