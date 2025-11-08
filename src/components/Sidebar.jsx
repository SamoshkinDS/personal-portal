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
      { id: "admin-users", path: "/admin/users", label: "Пользователи" },
      { id: "admin-content", path: "/admin/content", label: "Контент" },
      { id: "admin-logs", path: "/admin/logs", label: "Журнал" },
    ],
  },
];

function ItemIcon({ children, active }) {
  return (
    <span className={`sidebar__link-icon ${active ? "ring-2 ring-blue-400/40 bg-blue-50 text-blue-700 dark:bg-white/10 dark:ring-white/20 dark:text-blue-200" : ""}`}>
      {children}
    </span>
  );
}

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({
    ai: location.pathname.startsWith("/ai"),
    vpn: location.pathname.startsWith("/vpn"),
    admin: location.pathname.startsWith("/admin"),
    accounting: location.pathname.startsWith("/accounting"),
  });

  const role = user?.role || "NON_ADMIN";
  const perms = useMemo(() => new Set(user?.permissions || []), [user]);
  const hasPerm = (perm) => role === "ALL" || perms.has(perm) || perms.has("admin_access");

  const filteredNav = useMemo(() => {
    return NAV.filter((item) => {
      if (item.id === "admin") return hasPerm("admin_access");
      if (item.id === "analytics") return hasPerm("view_analytics");
      if (item.id === "ai") return hasPerm("view_ai");
      if (item.id === "vpn") return hasPerm("view_vpn") || user?.vpnCanCreate;
      return true;
    });
  }, [role, user?.vpnCanCreate, perms]);

  const renderLink = (item) => {
    const active = item.path ? location.pathname.startsWith(item.path) : false;
    if (item.children) {
      let childrenList = item.children;
      if (item.id === "accounting") {
        childrenList = item.children.filter((child) => {
          if (child.id === "accounting-dashboard") return hasPerm("accounting:view");
          if (child.id === "accounting-settings") return hasPerm("accounting:admin");
          return hasPerm("accounting:edit");
        });
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
            className={`group relative flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition ${
              hasActiveChild
                ? "bg-gradient-to-r from-blue-500/15 to-indigo-600/15 text-slate-900 ring-1 ring-blue-500/20 dark:from-indigo-500/20 dark:to-blue-600/20 dark:text-white dark:ring-white/10"
                : "text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <ItemIcon active={hasActiveChild && isCollapsed}>{item.icon}</ItemIcon>
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
                      `flex items-center gap-3 rounded-2xl px-3 py-2 text-xs transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20 dark:bg-white/10 dark:text-blue-200"
                          : "text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
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
          `group relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition ${
            isActive
              ? "bg-gradient-to-r from-blue-500/15 to-indigo-600/15 text-slate-900 ring-1 ring-blue-500/20 dark:from-indigo-500/20 dark:to-blue-600/20 dark:text-white dark:ring-white/10"
              : "text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
          }`
        }
      >
        <ItemIcon active={active && isCollapsed}>{item.icon}</ItemIcon>
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
            <img src="/free-icon-humanoid-robot-18220143.png" alt="Logo" className="h-6 w-6 object-contain" />
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
          <div className="flex flex-col gap-1">{filteredNav.map(renderLink)}</div>
        </nav>
        <div className="sticky bottom-0 border-t border-white/10 px-3 py-3">
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
              <nav className="max-h-[calc(100%-56px)] overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-1">{filteredNav.map(renderLink)}</div>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
