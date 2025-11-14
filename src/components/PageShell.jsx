import React from "react";
import MainHeader from "./layout/MainHeader.jsx";
import MobileNavCarousel from "./navigation/MobileNavCarousel.jsx";

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
    <div className={`page-shell flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-10 ${className}`}>
      <MainHeader
        title={title}
        actions={actions}
        onLogout={onLogout}
        onMenuToggle={onMenuToggle || (() => window.__toggleSidebar && window.__toggleSidebar())}
        showMenuButton={true}
      />
      <MobileNavCarousel />
      <div
        className={`page-shell__content flex-1 rounded-3xl text-gray-900 transition-colors duration-500 dark:text-gray-100 ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
