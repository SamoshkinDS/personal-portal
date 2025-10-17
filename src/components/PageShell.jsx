import React from "react";
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
      <div
        className={`page-shell__content flex-1 rounded-3xl text-gray-900 transition-colors duration-500 dark:text-gray-100 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
