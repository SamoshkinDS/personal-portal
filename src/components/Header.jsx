// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";
import useNotifications from "../hooks/useNotifications.js";
import NotificationsPanel from "./NotificationsPanel.jsx";

export default function Header({ title, actions, onLogout, onMenuToggle, showMenuButton = true }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [elevated, setElevated] = React.useState(false);
  const notif = useNotifications();

  React.useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
    else logout();
  };

  const handleHomeClick = (event) => {
    event.preventDefault();
    if (window.history && window.history.pushState) {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.location.href = "/";
    }
  };

  return (
    <>
      <motion.header
        className={`header sticky top-0 z-20 flex flex-col gap-4 rounded-3xl bg-white/85 px-4 py-4 text-gray-900 ${
          elevated ? "shadow-md" : "shadow-sm"
        } backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:text-gray-100 sm:flex-row sm:items-center sm:justify-between sm:px-5`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-gray-700 ring-1 ring-black/5 transition hover:bg-white dark:bg-slate-800/70 dark:text-gray-200 dark:hover:bg-slate-800"
              aria-label="Показать меню"
            >
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </button>
          )}
          <Logo showName={false} size="md" className="sm:hidden" />
          <a
            href="/"
            onClick={handleHomeClick}
            className="hidden"
            title="На главную"
            aria-label="На главную"
          >
            <span className="font-black text-lg tracking-wide">S</span>
          </a>
          <div>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
            {user && (
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Пользователь: {user.username}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                notif.openPanel();
                notif.fetchFromServer();
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white/70 text-xl text-blue-500 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-blue-400/40 dark:bg-slate-800/70 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
              aria-label="Открыть уведомления"
              title="Уведомления"
            >
              🔔
            </button>
            {notif.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white shadow-lg">
                {notif.unreadCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white/70 text-gray-700 transition hover:bg-white dark:border-gray-600 dark:bg-slate-800/70 dark:text-gray-200"
            aria-label="Переключить тему"
            title={isDark ? "Светлая тема" : "Тёмная тема"}
          >
            {isDark ? "🌙" : "☀️"}
          </button>

          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-red-400 px-4 py-2 text-sm font-medium text-red-500 transition hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            Выйти
          </button>
        </div>
      </motion.header>

      <NotificationsPanel
        visible={notif.panelVisible}
        open={notif.panelOpen}
        onClose={notif.closePanel}
        items={notif.unread}
        loading={notif.loading}
        error={notif.error}
        onReload={notif.fetchFromServer}
        onRead={notif.markRead}
        onReadAll={notif.markAllRead}
      />
    </>
  );
}
