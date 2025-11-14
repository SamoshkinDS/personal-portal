// encoding: utf-8
import React from "react";
import Logo from "../Logo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../hooks/useTheme.js";
import useNotifications from "../../hooks/useNotifications.js";
import NotificationsPanel from "../NotificationsPanel.jsx";

export default function MainHeader({ title, actions, onLogout, onMenuToggle, showMenuButton = true }) {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const notif = useNotifications();

  const handleLogout = () => {
    if (onLogout) onLogout();
    else logout();
  };

  const handleNotificationsClick = () => {
    notif.openPanel();
    notif.fetchFromServer();
  };

  return (
    <>
      <header className="sticky top-0 z-50 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-colors duration-300 dark:bg-slate-900/70 dark:ring-white/10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {showMenuButton && (
              <button
                type="button"
                onClick={onMenuToggle}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-gray-700 ring-1 ring-black/5 transition hover:bg-white dark:bg-slate-800/70 dark:text-gray-200 dark:ring-white/10 md:hidden"
                aria-label="Открыть меню"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-6 rounded-full bg-current" />
                  <span className="block h-0.5 w-6 rounded-full bg-current" />
                  <span className="block h-0.5 w-6 rounded-full bg-current" />
                </span>
              </button>
            )}
            <Logo showName={false} size="md" className="shrink-0" />
            {title && (
              <span className="truncate text-2xl font-semibold text-slate-900 dark:text-white">{title}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}

            <button
              type="button"
              onClick={handleNotificationsClick}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200/50 bg-white/80 text-xl text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-400/40 dark:bg-slate-800/70 dark:text-blue-200"
              aria-label="Уведомления"
            >
              🔔
              {notif.unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white shadow-lg">
                  {notif.unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/80 text-lg text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-200"
              aria-label="Переключить тему"
            >
              {isDark ? "🌙" : "☀️"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center justify-center rounded-2xl border border-red-300/70 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-red-400/30 dark:bg-transparent dark:text-red-200 dark:hover:border-red-400 dark:hover:bg-red-500/10 md:inline-flex"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

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
