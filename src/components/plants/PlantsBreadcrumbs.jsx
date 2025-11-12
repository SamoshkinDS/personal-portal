import React from "react";
import { Link } from "react-router-dom";

export default function PlantsBreadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Хлебные крошки" className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-slate-500 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-600 dark:text-slate-200">{item.label}</span>
              )}
              {!isLast && <span className="text-slate-300 dark:text-slate-600">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

