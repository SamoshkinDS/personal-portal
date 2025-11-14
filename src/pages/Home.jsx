// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell.jsx";
import TaskBoard from "../components/TaskBoard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const quickLinks = [
  {
    to: "/analytics",
    title: "Аналитика",
    description: "Ключевые показатели и графики",
    badge: "Отчёты",
    iconBg: "bg-sky-500/10 text-sky-500 dark:bg-sky-400/15 dark:text-sky-300",
    glow: "from-sky-500/20 via-sky-500/10 to-transparent",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M4 20V9" />
        <path d="M10 20V4" />
        <path d="M16 20v-6" />
        <path d="M22 20V11" />
      </svg>
    ),
  },
  {
    to: "/ai",
    title: "AI & ML",
    description: "Запросы к моделям, истории решений",
    badge: "Идеи",
    iconBg: "bg-violet-500/10 text-violet-500 dark:bg-violet-400/15 dark:text-violet-300",
    glow: "from-violet-500/20 via-violet-500/10 to-transparent",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M9.5 2.5a3 3 0 0 1 5 0l.3.6a3 3 0 0 0 1.2 1.2l.6.3a3 3 0 0 1 0 5l-.6.3a3 3 0 0 0-1.2 1.2l-.3.6a3 3 0 0 1-5 0l-.3-.6a3 3 0 0 0-1.2-1.2l-.6-.3a3 3 0 0 1 0-5l.6-.3a3 3 0 0 0 1.2-1.2l.3-.6Z" />
        <path d="M8 16v2a4 4 0 0 0 4 4" />
        <path d="M16 16v2a4 4 0 0 1-4 4" />
        <path d="M7 8h.01" />
        <path d="M12 4h.01" />
        <path d="M17 8h.01" />
      </svg>
    ),
  },
  {
    to: "/docs",
    title: "Документация",
    description: "Регламенты, инструкции, чек-листы",
    badge: "База знаний",
    iconBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-300",
    glow: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h10l4 4v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M14 4v5a1 1 0 0 0 1 1h5" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    to: "/vpn",
    title: "Доступы",
    description: "VPN, Outline, ключи и конфиги",
    badge: "Инструменты",
    iconBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300",
    glow: "from-amber-500/20 via-amber-500/10 to-transparent",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4.97 0 9-4.03 9-9S16.97 4 12 4 3 8.03 3 13c0 2.04.66 3.94 1.77 5.48a2 2 0 0 1 .33 1.11v1.41a1 1 0 0 0 1.45.89l2.55-1.27a2 2 0 0 1 1.78 0l2.55 1.27a1 1 0 0 0 1.45-.89v-1.41a2 2 0 0 1 .33-1.11A8.96 8.96 0 0 0 21 13" />
        <path d="M9 13h.01" />
        <path d="M12 13h.01" />
        <path d="M15 13h.01" />
      </svg>
    ),
  },
];

const plantsLink = {
  to: "/plants",
  title: "Растения",
  description: "Каталог, карточки, фильтры и галерея коллекции",
  badge: "Коллекция",
  iconBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300",
  glow: "bg-emerald-500/20",
  icon: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V11" />
      <path d="M12 11C7 11 4 7.5 4 4c4 0 8 3 8 7Z" />
      <path d="M12 11c0-4 4-7 8-7 0 3.5-3 7-8 7Z" />
      <path d="M12 22c0-3 2-6 5-8" />
      <path d="M12 22c0-3-2-6-5-8" />
    </svg>
  ),
};

const financeLink = {
  to: "/accounting",
  title: "Финансы",
  description: "Дашборд, платежи, транзакции и прогнозы",
  badge: "Финансы",
  iconBg: "bg-fuchsia-500/10 text-fuchsia-500 dark:bg-fuchsia-400/10 dark:text-fuchsia-300",
  glow: "bg-fuchsia-500/20",
  icon: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h18" />
    </svg>
  ),
};
function Home() {
  const { user } = useAuth();
  const accountingAvailable = React.useMemo(() => {
    if (!user) return false;
    if (user.role === "ALL") return true;
    const perms = new Set(user.permissions || []);
    return perms.has("accounting:view") || perms.has("accounting:edit") || perms.has("accounting:admin");
  }, [user]);
  const links = React.useMemo(() => {
    const base = [...quickLinks, plantsLink];
    if (accountingAvailable) {
      base.push(financeLink);
    }
    return base;
  }, [accountingAvailable]);
  const highlights = React.useMemo(
    () => [
      { label: "Роль", value: user?.role || "—" },
      { label: "Финансы", value: accountingAvailable ? "Доступ открыт" : "Нет доступа" },
      { label: "Сервисы", value: `${links.length}` },
    ],
    [user, accountingAvailable, links]
  );
  const heroActions = React.useMemo(
    () => [
      {
        to: "/analytics",
        title: "Перейти к аналитике",
        description: "Следи за ключевыми метриками команды.",
      },
      {
        to: "/ai",
        title: "AI-помощник",
        description: "Задай вопрос модели или изучи историю решений.",
      },
    ],
    []
  );

  return (
    <PageShell title="Главная" contentClassName="home flex flex-col gap-8 bg-transparent p-0">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.div
          layout
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm transition-colors duration-500 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-900 sm:p-8"
        >
          <span className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-400/10" />
          <span className="pointer-events-none absolute -bottom-24 -left-8 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                Привет, {user?.username || "коллега"} 👋
              </h1>
              <p className="mt-3 text-base leading-6 text-gray-600 dark:text-gray-400">
                Это персональная панель: следи за ключевыми метриками, статусами сервисов и задач ежедневно в одном месте.
                Расставь приоритеты и продолжай прогресс.
              </p>
            </div>
            <div className="grid w-full gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:w-auto lg:min-w-[320px]">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-0 flex-col rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-3 text-left shadow-sm transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-800/70"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          {heroActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-900/80"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 transition-opacity duration-500 group-hover:opacity-100 dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400" />
              <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 transition-colors group-hover:text-blue-500 dark:text-blue-300 dark:group-hover:text-blue-200">
                {action.title}
              </span>
              <p className="mt-3 text-sm text-slate-600 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                {action.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all group-hover:gap-3 dark:text-blue-300">
                Открыть
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 15L15 5" />
                  <path d="M7 5h8v8" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.map((item) => (
            <motion.article
              key={item.to}
              layout
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-sm transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/80"
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br opacity-60 blur-3xl transition duration-500 group-hover:opacity-100 ${item.glow}`}
              />
              <Link to={item.to} className="flex h-full flex-col gap-6 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                <div className="flex items-center justify-between gap-4">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner ${item.iconBg}`}>
                    {item.icon}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-300">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                      {item.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all group-hover:gap-3 dark:text-blue-300">
                    Перейти
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 15L15 5" />
                      <path d="M7 5h8v8" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-sm transition-colors duration-500 dark:border-slate-700/60 dark:bg-slate-900/80">
        <TaskBoard />
      </section>
    </PageShell>
  );
}

export default Home;
