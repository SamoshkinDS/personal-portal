// encoding: utf-8
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  {
    id: "analytics",
    path: "/analytics",
    label: "Аналитика",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 20v-7" />
        <path d="M9 20v-4" />
        <path d="M15 20V10" />
        <path d="M20 20V4" />
      </svg>
    )
  },
  {
    id: "ai",
    path: "/ai",
    label: "Нейросервисы",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 6v4" />
        <path d="M12 14v4" />
        <path d="M8 10h8" />
        <path d="M12 2a5 5 0 0 1 5 5v1a3 3 0 0 0 0 6v1a5 5 0 0 1-10 0v-1a3 3 0 0 0 0-6V7a5 5 0 0 1 5-5Z" />
      </svg>
    )
  },
  {
    id: "docs",
    path: "/docs",
    label: "Документация",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M14 4v6h6" />
      </svg>
    )
  },
  {
    id: "posts",
    path: "/posts",
    label: "Посты",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5V5a1 1 0 0 1 1-1h10l5 5v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
        <path d="M14 3.5V9h5" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    )
  },
  {
    id: "settings",
    path: "/settings",
    label: "Настройки",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.18A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.18a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.18A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    )
  },
  {
    id: "vpn",
    label: "VPN",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a9 9 0 0 0-9 9 8.93 8.93 0 0 0 2.69 6.42c.34.34.53.8.54 1.28v1.48a1.5 1.5 0 0 0 2.12 1.36l3.16-1.41a3 3 0 0 1 2.58 0l3.16 1.41a1.5 1.5 0 0 0 2.12-1.36v-1.48c0-.48.2-.94.54-1.28A8.93 8.93 0 0 0 21 12a9 9 0 0 0-9-9Z" />
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M12 12h.01" />
      </svg>
    ),
    children: [
      {
        id: "vpn-outline",
        path: "/vpn/outline",
        label: "Outline"
      },
      {
        id: "vpn-vless",
        path: "/vpn/vless",
        label: "VLESS"
      }
    ]
  },
  {
    id: "admin",
    path: "/admin",
    label: "Админ-панель",
    icon: (
      <svg
        className="sidebar__icon h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z" />
        <path d="M3 21a9 9 0 0 1 18 0" />
      </svg>
    )
  }
];

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  useEffect(() => {
    setExpandedGroups((prev) => ({
      ...prev,
      vpn: activePath.startsWith("/vpn") || prev.vpn
    }));
  }, [activePath]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const renderNavLink = (item) => {
    const isActive = item.path ? activePath.startsWith(item.path) : false;

    if (item.children) {
      const hasActiveChild = item.children.some((child) =>
        activePath.startsWith(child.path)
      );
      const isExpanded = !isCollapsed && expandedGroups[item.id];

      const handleGroupClick = () => {
        if (isCollapsed) {
          setIsCollapsed(false);
          setExpandedGroups((prev) => ({
            ...prev,
            [item.id]: true
          }));
        } else {
          toggleGroup(item.id);
        }
      };

      return (
        <div key={item.id} className="sidebar__group space-y-1">
          <button
            type="button"
            onClick={handleGroupClick}
            className={`sidebar__link group relative flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition ${
              hasActiveChild
                ? "bg-white/10 text-white shadow-lg shadow-blue-500/10"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="sidebar__link-icon flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl text-blue-300 transition group-hover:bg-blue-500/20 group-hover:text-blue-200">
                {item.icon}
              </span>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    className="sidebar__link-label"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {!isCollapsed && (
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                className="text-lg text-white/70"
              >
                ▸
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="pl-14"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col space-y-1">
                  {item.children.map((child) => {
                    const childActive = activePath.startsWith(child.path);
                    return (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        className={({ isActive: navActive }) =>
                          `sidebar__sublink rounded-2xl px-4 py-2 text-sm font-medium transition ${
                            childActive || navActive
                              ? "bg-white/10 text-white shadow shadow-blue-500/10"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
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
        className={({ isActive: navActive }) =>
          `sidebar__link group relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium transition ${
            isActive || navActive
              ? "bg-white/10 text-white shadow-lg shadow-blue-500/10"
              : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`
        }
        title={item.label}
      >
        <span className="sidebar__link-icon flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl text-blue-300 transition group-hover:bg-blue-500/20 group-hover:text-blue-200">
          {item.icon}
        </span>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.span
              className="sidebar__link-label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isCollapsed && (
          <span className="sidebar__tooltip pointer-events-none absolute left-[72px] top-1/2 hidden -translate-y-1/2 rounded-lg bg-slate-800 px-3 py-1 text-xs text-gray-100 shadow-lg group-hover:flex">
            {item.label}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <motion.aside
      className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""} sticky top-0 hidden h-screen bg-slate-900/95 text-gray-100 shadow-lg shadow-slate-900/25 transition-colors duration-500 dark:bg-slate-950/95 sm:flex sm:flex-col`}
      animate={{ width: isCollapsed ? 88 : 256 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
    >
      <div className="sidebar__header flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="sidebar__brand text-lg font-semibold tracking-wide">
          {isCollapsed ? "PP" : "Персональный портал"}
        </span>
        <button
          type="button"
          className="sidebar__toggle flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          <motion.span
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </motion.span>
        </button>
      </div>

      <nav className="sidebar__nav flex-1 overflow-y-auto px-3 py-6">
        <div className="flex flex-col gap-1">{navItems.map(renderNavLink)}</div>
      </nav>
    </motion.aside>
  );
}
