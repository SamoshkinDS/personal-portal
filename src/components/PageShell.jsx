import React from "react";
import { motion } from "framer-motion";
import Header from "./Header.jsx";

/**
 * Shared shell that combines header and consistent inner spacing for pages.
 */
export default function PageShell({
  title,
  actions,
  onLogout,
  onMenuToggle,
  children,
  className = "",
  contentClassName = "",
}) {
  return (
    <div className={`page-shell flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 ${className}`}>
      <Header
        title={title}
        actions={actions}
        onLogout={onLogout}
        onMenuToggle={onMenuToggle || (() => window.__toggleSidebar && window.__toggleSidebar())}
        showMenuButton={true}
      />
      {/* Динамический заголовок с подложкой */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-600/10 p-4 ring-1 ring-blue-500/10 dark:from-blue-500/20 dark:to-indigo-600/20"
        >
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</div>
        </motion.div>
      )}
      <div
        className={`page-shell__content flex-1 rounded-3xl text-gray-900 transition-colors duration-500 dark:text-gray-100 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
