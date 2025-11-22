// encoding: utf-8
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";
import { DEFAULT_NAV_ITEMS, NAV_ICONS } from "./navigation/navConfig.jsx";
import { useNavigationPreferences } from "../context/NavigationPreferencesContext.jsx";

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const { visibleNav, loading } = useNavigationPreferences();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const navStructure = visibleNav?.length ? visibleNav : DEFAULT_NAV_ITEMS;

  useEffect(() => {
    const currentSection = navStructure.find(
      (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    );
    if (currentSection?.children?.length) {
      setExpandedId(currentSection.id);
    } else {
      setExpandedId((prev) =>
        prev && navStructure.some((item) => item.id === prev && item.children?.length) ? prev : null
      );
    }
  }, [location.pathname, navStructure]);

  useEffect(() => {
    if (mobileOpen && collapsed) {
      setCollapsed(false);
    }
  }, [mobileOpen, collapsed]);

  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const filteredNav = useMemo(() => {
    if (!search.trim()) return navStructure;
    const term = search.toLowerCase();
    return navStructure
      .map((item) => {
        if (!item.children) {
          return item.label.toLowerCase().includes(term) ? item : null;
        }
        const kids = item.children.filter((child) => child.label.toLowerCase().includes(term));
        if (kids.length || item.label.toLowerCase().includes(term)) {
          return { ...item, children: kids };
        }
        return null;
      })
      .filter(Boolean);
  }, [navStructure, search]);

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
              aria-label={isExpanded ? "Свернуть раздел" : "Развернуть раздел"}
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
            placeholder="Поиск по меню"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {loading && (
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            Загружаем меню...
          </div>
        )}
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
              <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role || "Без роли"}</div>
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
            {NAV_ICONS.logout}
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
