// encoding: utf-8
import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  {
    id: "home",
    path: "/",
    label: "Главная",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "analytics",
    path: "/analytics",
    label: "Аналитика",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20v-7" />
        <path d="M9 20v-4" />
        <path d="M15 20V10" />
        <path d="M20 20V4" />
      </svg>
    ),
  },
  {
    id: "ai",
    path: "/ai",
    label: "AI и ML",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6v4" />
        <path d="M12 14v4" />
        <path d="M8 10h8" />
        <path d="M12 2a5 5 0 0 1 5 5v1a3 3 0 0 0 0 6v1a5 5 0 0 1-10 0v-1a3 3 0 0 0 0-6V7a5 5 0 0 1 5-5Z" />
      </svg>
    ),
    children: [
      { id: "ai-overview", path: "/ai", label: "Обзор" },
      { id: "ai-n8n", path: "/ai/n8n", label: "N8N" },
    ],
  },
  {
    id: "docs",
    path: "/docs",
    label: "Документация",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M14 4v6h6" />
      </svg>
    ),
  },
  {
    id: "posts",
    path: "/posts",
    label: "Посты",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5V5a1 1 0 0 1 1-1h10l5 5v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
        <path d="M14 3.5V9h5" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    ),
  },
  {
    id: "plants",
    path: "/plants",
    label: "Растения",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V11" />
        <path d="M12 11c-4.5 0-7-3-7-7 4 0 7 2.5 7 7Z" />
        <path d="M12 11c0-4.5 3-7 7-7 0 4-2.5 7-7 7Z" />
        <path d="M12 22c0-4 2-7 5-9" />
        <path d="M12 22c0-3-2-6-5-8" />
      </svg>
    ),
    children: [
      { id: "plants-list", path: "/plants", label: "Список растений" },
          {
            id: "plants-problems",
            path: "/problems",
            label: "Проблемы и решения",
            icon: (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 21v-4" />
                <path d="M8 21v-2" />
                <path d="M12 21v-6" />
                <path d="M16 21v-4" />
                <path d="M20 21V8" />
                <path d="M22 7 12 3 2 7" />
                <path d="M18 17h4" />
                <path d="M2 21h20" />
              </svg>
            ),
          },
      {
        id: "plants-pests",
        path: "/pests",
        label: "Вредители",
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76 2.83-2.83" />
          </svg>
        ),
      },
      {
        id: "plants-diseases",
        path: "/diseases",
        label: "Заболевания",
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9" />
            <path d="m22 2-5 5" />
            <path d="M14 8h.01" />
            <path d="M9 13h.01" />
            <path d="M13 16h.01" />
          </svg>
        ),
      },
      {
        id: "plants-medicines",
        path: "/medicines",
        label: "Лекарства",
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="3.5" />
            <rect x="14" y="3" width="7" height="18" rx="3.5" />
            <path d="M7 8h9" />
          </svg>
        ),
      },
      { id: "plants-settings", path: "/plants/settings", label: "Настройки", perm: "plants_admin" },
    ],
  },
  {
    id: "accounting",
    label: "Финансы",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
        <path d="M3 9h18" />
      </svg>
    ),
    children: [
      { id: "accounting-dashboard", path: "/accounting", label: "Дашборд" },
      { id: "accounting-accounts", path: "/accounting/accounts", label: "Счета" },
      { id: "accounting-payments", path: "/accounting/payments", label: "Платежи" },
      { id: "accounting-transactions", path: "/accounting/transactions", label: "Транзакции" },
      { id: "accounting-incomes", path: "/accounting/incomes", label: "Доходы" },
      { id: "accounting-categories", path: "/accounting/categories", label: "Категории" },
      { id: "accounting-settings", path: "/accounting/settings", label: "Настройки" },
    ],
  },
  {
    id: "settings",
    path: "/settings",
    label: "Настройки",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1 1 0 0 0 1.82.33h.18A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.18a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.18A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    id: "vpn",
    label: "VPN",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 0 0-9 9 8.93 8.93 0 0 0 2.69 6.42c.34.34.53.8.54 1.28v1.48a1.5 1.5 0 0 0 2.12 1.36l3.16-1.41a3 3 0 0 1 2.58 0l3.16 1.41a1.5 1.5 0 0 0 2.12-1.36v-1.48c0-.48.2-.94.54-1.28A8.93 8.93 0 0 0 21 12a9 9 0 0 0-9-9Z" />
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M12 12h.01" />
      </svg>
    ),
    children: [
      { id: "vpn-home", path: "/vpn", label: "Главная" },
      { id: "vpn-outline", path: "/vpn/outline", label: "Outline" },
      { id: "vpn-vless", path: "/vpn/vless", label: "VLESS" },
    ],
  },
  {
    id: "admin",
    label: "Админ-панель",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z" />
        <path d="M3 21a9 9 0 0 1 18 0" />
      </svg>
    ),
    children: [
      { id: "admin-home", path: "/admin", label: "Главная" },
      { id: "admin-users", path: "/admin/users", label: "Пользователи" },
      { id: "admin-content", path: "/admin/content", label: "Контент" },
      { id: "admin-logs", path: "/admin/logs", label: "Журнал" },
    ],
  },
];

const NAV_MAP = NAV.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const NAV_GROUPS = [
  { id: "overview", title: "Рабочая зона", items: ["home", "analytics", "ai", "docs", "posts"] },
  { id: "operations", title: "Инфраструктура", items: ["plants", "vpn"] },
  { id: "finance", title: "Финансы", items: ["accounting"] },
  { id: "system", title: "Система", items: ["settings", "admin"] },
];

function ItemIcon({ children, active }) {
  return <span className={`sidebar__link-icon ${active ? "is-active" : ""}`}>{children}</span>;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({
    ai: location.pathname.startsWith("/ai"),
    vpn: location.pathname.startsWith("/vpn"),
    admin: location.pathname.startsWith("/admin"),
    accounting: location.pathname.startsWith("/accounting"),
    plants:
      location.pathname.startsWith("/plants") ||
      location.pathname.startsWith("/pests") ||
      location.pathname.startsWith("/diseases") ||
      location.pathname.startsWith("/medicines") ||
      location.pathname.startsWith("/problems"),
  });
  const groupedNav = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.map((id) => NAV_MAP[id]).filter(Boolean),
      })),
    [],
  );

  const role = user?.role || "NON_ADMIN";
  const perms = useMemo(() => new Set(user?.permissions || []), [user]);
  const hasPerm = (perm) => role === "ALL" || perms.has(perm) || perms.has("admin_access");
  const allowAdmin = hasPerm("admin_access");
  const allowAnalytics = hasPerm("view_analytics");
  const allowAI = hasPerm("view_ai");
  const allowVPN = hasPerm("view_vpn") || user?.vpnCanCreate;
  const allowAccountingView = hasPerm("accounting:view");
  const allowAccountingEdit = hasPerm("accounting:edit");
  const allowAccountingAdmin = hasPerm("accounting:admin");

  const handleLogout = () => {
    logout();
    if (mobileOpen) onCloseMobile();
  };

  const renderLink = (item) => {
    if (!item) return null;
    const active = item.path ? location.pathname.startsWith(item.path) : false;
    if (item.id === "admin" && !allowAdmin) return null;
    if (item.id === "analytics" && !allowAnalytics) return null;
    if (item.id === "ai" && !allowAI) return null;
    if (item.id === "vpn" && !allowVPN) return null;
    if (item.children) {
      let childrenList = item.children;
      if (item.id === "accounting") {
        childrenList = item.children.filter((child) => {
          if (child.id === "accounting-dashboard") return allowAccountingView || allowAccountingEdit || allowAccountingAdmin;
          if (child.id === "accounting-settings") return allowAccountingAdmin;
          return allowAccountingEdit || allowAccountingAdmin;
        });
        if (childrenList.length === 0) return null;
      } else {
        childrenList = childrenList.filter((child) => !child.perm || hasPerm(child.perm));
        if (childrenList.length === 0) return null;
      }
      const isOpen = !isCollapsed && expanded[item.id];
      const hasActiveChild = childrenList.some((c) => location.pathname.startsWith(c.path));
      const toggle = () =>
        setExpanded((prev) => ({
          ...prev,
          [item.id]: !prev[item.id],
        }));
      return (
        <div key={item.id} className="space-y-1">
          <button
            type="button"
            onClick={toggle}
            className={`group relative flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              hasActiveChild
                ? "bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-900 shadow-lg ring-1 ring-blue-500/30 dark:from-blue-500/25 dark:to-indigo-500/25 dark:text-white"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <ItemIcon active={hasActiveChild || active}>{item.icon}</ItemIcon>
              {!isCollapsed && <span>{item.label}</span>}
            </span>
            {!isCollapsed && (
              <motion.span initial={{ rotate: 0 }} animate={{ rotate: isOpen ? 90 : 0 }} className="ml-auto text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </motion.span>
            )}
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="ml-2 space-y-1 pl-3">
                {childrenList.map((child) => (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    onClick={() => {
                      if (mobileOpen) onCloseMobile();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? "bg-blue-100/80 text-blue-700 ring-1 ring-blue-500/30 dark:bg-blue-500/20 dark:text-white"
                          : "text-slate-500 hover:bg-white/60 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                      }`
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {child.label}
                  </NavLink>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={() => {
          if (mobileOpen) onCloseMobile();
        }}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            isActive
              ? "bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-900 shadow-lg ring-1 ring-blue-500/30 dark:from-blue-500/25 dark:to-indigo-500/25 dark:text-white"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
          }`
        }
      >
        <ItemIcon active={active}>{item.icon}</ItemIcon>
        {!isCollapsed && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}>
            {item.label}
          </motion.span>
        )}
        {isCollapsed && (
          <span className="pointer-events-none absolute left-[72px] top-1/2 hidden -translate-y-1/2 rounded-lg bg-slate-800 px-3 py-1 text-xs text-gray-100 shadow-lg group-hover:flex">
            {item.label}
          </span>
        )}
      </NavLink>
    );
  };

  const brand = (
    <div className={`flex items-center justify-between border-b border-white/10 ${isCollapsed ? "px-2" : "px-5"} py-4`}>
      <span className="flex items-center gap-3">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.history?.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          className="inline-flex items-center gap-3"
        >
          <span className="sidebar__link-icon">
            <img src="/favi.png" alt="Logo" className="h-10 w-10 object-contain" />
          </span>
          {!isCollapsed && <span className="text-lg font-semibold tracking-wide">SAMOSHECHKIN</span>}
        </a>
      </span>
    </div>
  );

  return (
    <>
      <motion.aside
        className={`sticky top-0 hidden h-screen bg-white text-gray-900 shadow-lg ring-1 ring-black/5 transition-colors duration-200 dark:bg-slate-950 dark:text-gray-100 sm:flex sm:flex-col ${isCollapsed ? "w-[88px]" : "w-[256px]"}`}
        animate={{ width: isCollapsed ? 88 : 256 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
      >
        {brand}
        <nav className="flex-1 overflow-y-auto px-3 py-6" style={{ scrollbarGutter: "stable" }}>
          <div className="flex flex-col gap-6">
            {groupedNav.map((group) => {
              const visibleItems = group.items.map(renderLink).filter(Boolean);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.id} className="space-y-2">
                  <p className="px-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400/80 dark:text-slate-500">{group.title}</p>
                  <div className="flex flex-col gap-1">{visibleItems}</div>
                </div>
              );
            })}
          </div>
        </nav>
        <div className="sticky bottom-0 border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-200"
          >
            <span>Выйти</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-slate-700 ring-1 ring-black/5 transition hover:bg-white/80 dark:bg-slate-800/70 dark:text-gray-200 dark:ring-white/10"
            aria-label={isCollapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"}
          >
            <motion.span animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </motion.span>
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div key="mobile-drawer" className="fixed inset-0 z-40 sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseMobile}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.aside
              className="absolute left-0 top-0 h-full w-72 bg-white text-gray-900 shadow-2xl ring-1 ring-black/5 dark:bg-slate-950 dark:text-gray-100"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-4">
                <span className="text-base font-semibold">Меню</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                  aria-label="Закрыть меню"
                >
                  ×
                </button>
              </div>
              <nav className="max-h-[calc(100%-120px)] overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-6">
                  {groupedNav.map((group) => {
                    const visibleItems = group.items.map(renderLink).filter(Boolean);
                    if (visibleItems.length === 0) return null;
                    return (
                      <div key={group.id} className="space-y-2">
                        <p className="px-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400/80 dark:text-slate-500">
                          {group.title}
                        </p>
                        <div className="flex flex-col gap-1">{visibleItems}</div>
                      </div>
                    );
                  })}
                </div>
              </nav>
              <div className="border-t border-black/10 px-4 py-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-2xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                >
                  Выйти
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
