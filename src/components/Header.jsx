// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

// Унифицированный заголовок портала с кнопкой‑бургером на мобильных
export default function Header({ title, actions, onLogout, onMenuToggle, showMenuButton = true }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (onLogout) onLogout();
    else logout();
  };

  return (
    <motion.header
      className="header sticky top-0 z-20 flex flex-col gap-4 rounded-3xl bg-white/80 px-4 py-4 text-gray-900 shadow-sm backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:text-gray-100 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="header__info flex items-center gap-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-gray-700 ring-1 ring-black/5 transition hover:bg-white/80 dark:bg-slate-800/70 dark:text-gray-200 dark:hover:bg-slate-800"
            aria-label="Открыть меню"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>
        )}
        <div>
          <h1 className="header__title text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
          {user && (
            <p className="header__meta mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Пользователь: {user.username}
            </p>
          )}
        </div>
      </div>

      <div className="header__controls flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions && <div className="header__actions flex flex-wrap items-center gap-2">{actions}</div>}
        <button
          type="button"
          onClick={handleLogout}
          className="header__logout inline-flex items-center justify-center rounded-full border border-red-400 px-4 py-2 text-sm font-medium text-red-500 transition hover:border-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Выйти
        </button>
      </div>
    </motion.header>
  );
}

