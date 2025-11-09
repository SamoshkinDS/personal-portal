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
    iconBg: "bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-300",
    glow: "bg-sky-500/20",
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
    iconBg: "bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-300",
    glow: "bg-violet-500/20",
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
    iconBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300",
    glow: "bg-emerald-500/20",
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
    iconBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300",
    glow: "bg-amber-500/20",
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

  return (
    <PageShell title="Главная" contentClassName="home flex flex-col gap-6 bg-transparent p-0">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Привет, {user?.username || "коллега"}!</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Планируй задачи, следи за сроками и управляй сервисами компании из единого портала.
        </p>
      </section>

      <section className="mt-2">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:pt-0 xl:grid-cols-4">
          {links.map((item) => (
            <motion.div key={item.to} whileHover={{ y: -4 }} className="w-[240px] flex-shrink-0 snap-start md:w-auto">
              <Link
                to={item.to}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-900/85"
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-32 right-0 h-48 w-48 translate-x-16 rounded-full blur-3xl opacity-0 transition duration-500 group-hover:opacity-100 ${item.glow}`}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>{item.icon}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 transition-colors group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300">
                    {item.description}
                  </p>
                </div>
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
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
        <TaskBoard />
      </section>
    </PageShell>
  );
}

export default Home;

