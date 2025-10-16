// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Унифицированный заголовок портала: отображает название страницы, действия и выход.
 */
export default function Header({ title, actions, onLogout }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <motion.header
      className="header flex flex-col gap-4 rounded-3xl bg-white/80 px-5 py-4 text-gray-900 shadow-sm backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:text-gray-100 sm:flex-row sm:items-center sm:justify-between"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="header__info">
        <h1 className="header__title text-2xl font-semibold leading-tight sm:text-3xl">
          {title}
        </h1>
        {user && (
          <p className="header__meta mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Пользователь: {user.username}
          </p>
        )}
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
