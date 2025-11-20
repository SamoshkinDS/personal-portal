// encoding: utf-8
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h5v-5h4v5h5V10" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M22 20v-9" />
    </svg>
  ),
  career: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <path d="M9 8V5h6v3" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3a5 5 0 0 1 5 5v1a3 3 0 0 0 0 6v1a5 5 0 0 1-10 0v-1a3 3 0 0 0 0-6V8a5 5 0 0 1 5-5Z" />
      <path d="M12 6v12" />
      <path d="M8 10h8" />
    </svg>
  ),
  docs: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M15 3v5h4" />
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 4.5h10l4 4v11h-14z" />
      <path d="M15 4.5v4h4" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  plants: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 22V11" />
      <path d="M12 11c-4 0-6.5-2.5-6.5-6.5 4 0 6.5 2 6.5 6.5Z" />
      <path d="M12 11c0-4.5 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5Z" />
      <path d="M12 22c0-3 2-6 5-8" />
      <path d="M12 22c0-3-2-6-5-8" />
    </svg>
  ),
  accounting: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="4" width="7" height="16" rx="2" />
      <rect x="14" y="4" width="7" height="16" rx="2" />
      <path d="M7 8h.01M7 12h.01M7 16h.01M18 8h.01M18 12h.01M18 16h.01" />
    </svg>
  ),
  vpn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 3 7.5 12 12l9-4.5Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17.5 12 22l9-4.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15.4 9a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 20c14 0 14-13 14-13s-7-4-14 2c-3 3-2 11 3 11Z" />
      <path d="M5 20c6 0 10-6 10-6" />
    </svg>
  ),
  bug: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9 8V5a3 3 0 0 1 6 0v3" />
      <path d="M6 11h12" />
      <path d="M6 15h12" />
      <path d="M9 19h6" />
      <path d="M5 7 3 5" />
      <path d="m19 5-2 2" />
      <path d="M5 19l2-2" />
      <path d="m19 19-2-2" />
      <rect x="7" y="8" width="10" height="12" rx="2" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 4 6v6c0 5 4 7.7 8 9 4-1.3 8-4 8-9V6Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 19.5V5a1 1 0 0 1 1-1h10l4 4v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M9 10v6" />
      <path d="M13 12v4" />
      <path d="M17 9v7" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7 4h8l4 4v12H7Z" />
      <path d="M15 8H7" />
      <path d="M15 12H7" />
      <path d="M11 16H7" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="4" width="8" height="16" rx="2" />
      <rect x="13" y="8" width="8" height="12" rx="2" />
      <path d="M7 8h.01M7 12h.01M7 16h.01M17 12h.01M17 16h.01" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
    </svg>
  ),
};

const NAV = [
  { id: "home", path: "/", label: "Главная", icon: ICONS.home },
  {
    id: "analytics",
    path: "/analytics",
    label: "Аналитика",
    icon: ICONS.analytics,
    children: [
      { id: "analytics-home", path: "/analytics", label: "Обзор", icon: ICONS.chart },
      { id: "analytics-queue", path: "/analytics/queue", label: "Очередь статей", icon: ICONS.doc },
      { id: "analytics-interview", path: "/analytics/interview", label: "Интервью", icon: ICONS.doc },
      { id: "analytics-cheats", path: "/analytics/cheats", label: "Шпаргалки", icon: ICONS.doc },
      { id: "analytics-tests", path: "/analytics/tests", label: "Тесты", icon: ICONS.chart },
      { id: "analytics-settings", path: "/analytics/settings", label: "Интеграции", icon: ICONS.settings },
    ],
  },
  {
    id: "career",
    path: "/career",
    label: "Карьера",
    icon: ICONS.career,
    children: [
      { id: "career-dashboard", path: "/career", label: "Дашборд", icon: ICONS.home },
      { id: "career-skills", path: "/career/skills", label: "Навыки", icon: ICONS.chart },
      { id: "career-courses", path: "/career/courses", label: "Курсы", icon: ICONS.doc },
      { id: "career-portfolio", path: "/career/portfolio", label: "Портфолио", icon: ICONS.doc },
      { id: "career-timeline", path: "/career/portfolio/timeline", label: "Таймлайн", icon: ICONS.chart },
      { id: "career-analytics", path: "/career/analytics", label: "Аналитика", icon: ICONS.chart },
      { id: "career-interviews", path: "/career/interviews", label: "Интервью", icon: ICONS.doc },
      { id: "career-knowledge", path: "/career/knowledge", label: "Знания", icon: ICONS.doc },
      { id: "career-export", path: "/career/portfolio/export", label: "Экспорт", icon: ICONS.doc },
    ],
  },
  {
    id: "ai",
    path: "/ai",
    label: "AI & ML",
    icon: ICONS.ai,
    children: [
      { id: "ai-overview", path: "/ai", label: "Обзор", icon: ICONS.home },
      { id: "ai-n8n", path: "/ai/n8n", label: "n8n", icon: ICONS.chart },
      { id: "ai-promptmaster", path: "/ai/promptmaster", label: "Promptmaster", icon: ICONS.doc },
    ],
  },
  {
    id: "accounting",
    path: "/accounting",
    label: "Финансы",
    icon: ICONS.accounting,
    children: [
      { id: "accounting-dashboard", path: "/accounting", label: "Дашборд", icon: ICONS.chart },
      { id: "accounting-accounts", path: "/accounting/accounts", label: "Счета", icon: ICONS.doc },
      { id: "accounting-payments", path: "/accounting/payments", label: "Платежи", icon: ICONS.doc },
      { id: "accounting-transactions", path: "/accounting/transactions", label: "Транзакции", icon: ICONS.doc },
      { id: "accounting-incomes", path: "/accounting/incomes", label: "Доходы", icon: ICONS.doc },
      { id: "accounting-categories", path: "/accounting/categories", label: "Категории", icon: ICONS.doc },
      { id: "accounting-settings", path: "/accounting/settings", label: "Настройки", icon: ICONS.settings },
    ],
  },
  {
    id: "vpn",
    path: "/vpn",
    label: "VPN",
    icon: ICONS.vpn,
    children: [
      { id: "vpn-home", path: "/vpn", label: "Обзор", icon: ICONS.home },
      { id: "vpn-outline", path: "/vpn/outline", label: "Outline", icon: ICONS.shield },
      { id: "vpn-outline-guide", path: "/vpn/outline/guide", label: "Гайд Outline", icon: ICONS.doc },
      { id: "vpn-vless", path: "/vpn/vless", label: "VLESS", icon: ICONS.shield },
      { id: "vpn-vless-guide", path: "/vpn/vless/guide", label: "Гайд VLESS", icon: ICONS.doc },
      { id: "vpn-routes", path: "/vpn/vless/routes-guide", label: "Маршруты", icon: ICONS.chart },
    ],
  },
  {
    id: "plants",
    path: "/plants",
    label: "Растения",
    icon: ICONS.plants,
    children: [
      { id: "plants-list", path: "/plants", label: "Справочник", icon: ICONS.leaf },
      { id: "plants-problems", path: "/problems", label: "Проблемы", icon: ICONS.shield },
      { id: "plants-pests", path: "/pests", label: "Вредители", icon: ICONS.bug },
      { id: "plants-diseases", path: "/diseases", label: "Болезни", icon: ICONS.shield },
      { id: "plants-medicines", path: "/medicines", label: "Лекарства", icon: ICONS.doc },
      { id: "plants-settings", path: "/plants/settings", label: "Настройки", icon: ICONS.settings },
    ],
  },
  {
    id: "admin",
    path: "/admin",
    label: "Админка",
    icon: ICONS.admin,
    children: [
      { id: "admin-home", path: "/admin", label: "Обзор", icon: ICONS.home },
      { id: "admin-users", path: "/admin/users", label: "Пользователи", icon: ICONS.doc },
      { id: "admin-content", path: "/admin/content", label: "Контент", icon: ICONS.doc },
      { id: "admin-logs", path: "/admin/logs", label: "Логи", icon: ICONS.chart },
    ],
  },
  { id: "docs", path: "/docs", label: "Документация", icon: ICONS.docs },
  { id: "posts", path: "/posts", label: "Посты", icon: ICONS.posts },
  { id: "settings", path: "/settings", label: "Настройки", icon: ICONS.settings },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(() => NAV.find((i) => location.pathname.startsWith(i.path))?.id || null);

  useEffect(() => {
    if (mobileOpen && collapsed) {
      setCollapsed(false);
    }
  }, [mobileOpen, collapsed]);

  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const filteredNav = useMemo(() => {
    if (!search.trim()) return NAV;
    const term = search.toLowerCase();
    return NAV.map((item) => {
      if (!item.children) {
        return item.label.toLowerCase().includes(term) ? item : null;
      }
      const kids = item.children.filter((child) => child.label.toLowerCase().includes(term));
      if (kids.length || item.label.toLowerCase().includes(term)) {
        return { ...item, children: kids };
      }
      return null;
    }).filter(Boolean);
  }, [search]);

  const renderLink = (item, isChild = false) => {
    const active = isActivePath(item.path);
    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={onCloseMobile}
        className={({ isActive }) =>
          `group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
            active || isActive
              ? "bg-indigo-600/15 text-indigo-700 ring-1 ring-indigo-200 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-50 dark:ring-indigo-400/40"
              : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800/80"
          } ${collapsed && !isChild ? "justify-center px-2" : ""}`
        }
      >
        <span className={`${isChild ? "h-4 w-4" : "h-5 w-5"} text-current`}>{item.icon}</span>
        {!collapsed || isChild ? <span className="truncate">{item.label}</span> : null}
      </NavLink>
    );
  };

  const renderSection = (item) => {
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = expandedId === item.id || !hasChildren;
    const sectionActive = isActivePath(item.path);

    return (
      <div
        key={item.id}
        className={`rounded-2xl p-1 shadow-sm ring-1 transition ${
          sectionActive
            ? "bg-indigo-50/80 ring-indigo-200 dark:bg-slate-800/70 dark:ring-indigo-500/50"
            : "bg-white/60 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700/60"
        }`}
      >
        <div className="flex items-center">
          {renderLink(item)}
          {hasChildren && (
            <button
              type="button"
              aria-label={isExpanded ? "Свернуть" : "Развернуть"}
              onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
              className="ml-auto mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600"
            >
              {!collapsed && <span className="text-lg font-semibold">{isExpanded ? "-" : "+"}</span>}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && <div className="mt-1 space-y-1 pl-2">{item.children.map((child) => renderLink(child, true))}</div>}
      </div>
    );
  };

  const sidebarBody = (
    <div
      className={`flex h-full flex-col gap-4 border-r border-slate-200 bg-white/90 px-3 py-4 text-slate-900 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 ${
        collapsed ? "w-[76px]" : "w-72"
      } md:h-screen md:sticky md:top-0 md:rounded-none md:border-r`}
    >
      <div className="flex items-center">
        <Logo showName={!collapsed} size="md" className="shrink-0" />
      </div>

      {!collapsed && (
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по разделам"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {filteredNav.map((item) => renderSection(item))}
      </div>

      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-200 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            {collapsed ? <path d="m9 5 7 7-7 7" /> : <path d="m15 5-7 7 7 7" />}
          </svg>
          {!collapsed && <span>Свернуть</span>}
        </button>
      </div>

      <div className="mt-auto rounded-2xl bg-slate-100 p-3 text-sm shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800/70 dark:ring-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold uppercase text-white shadow">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user?.username || "Без имени"}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || "Роль не задана"}</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={`ml-auto flex items-center justify-center bg-rose-500 text-white shadow hover:bg-rose-600 ${collapsed ? "h-10 w-10 rounded-full" : "h-9 w-9 rounded-xl"}`}
            aria-label="Выйти"
            title="Выйти"
          >
            {ICONS.logout}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="max-md:hidden flex flex-shrink-0" style={{ width: collapsed ? "76px" : "288px" }}>
        {sidebarBody}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] flex overflow-hidden md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[61] bg-black/45"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: "-104%" }}
              animate={{ x: 0 }}
              exit={{ x: "-104%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.9 }}
              className="relative z-[62] h-full w-[min(320px,88vw)] overflow-y-auto overflow-x-hidden bg-white/95 p-3 pt-4 shadow-2xl backdrop-blur touch-pan-y overscroll-contain"
            >
              {sidebarBody}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
