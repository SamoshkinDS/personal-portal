// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";

const baseCard =
  "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60";

export function FlipperCategoryCard({ category, to }) {
  return (
    <Link to={to} className={baseCard}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{category.title}</div>
          <div className="text-xs text-slate-500">{category.slug}</div>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/40">
          {category.type}
        </span>
      </div>
      {category.description ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{category.description}</p> : null}
    </Link>
  );
}

export function FlipperFirmwareCard({ firmware, to }) {
  return (
    <Link to={to} className={baseCard}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{firmware.name}</div>
        <span className="text-xs text-slate-500">{firmware.slug}</span>
        {!firmware.is_active ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            выключено
          </span>
        ) : null}
      </div>
      {firmware.short_description ? (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{firmware.short_description}</p>
      ) : null}
    </Link>
  );
}

export function FlipperModuleCard({ module, to }) {
  return (
    <Link to={to} className={baseCard}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-500" />
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{module.name}</div>
        <span className="text-xs text-slate-500">{module.slug}</span>
        {!module.is_active ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            off
          </span>
        ) : null}
      </div>
      {module.short_description ? (
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{module.short_description}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-slate-500">
        Прошивка: {module.firmware_id || "—"} · Категория: {module.category_id || "—"}
      </p>
    </Link>
  );
}

export function FlipperArticleCard({ article, to }) {
  return (
    <Link to={to} className={baseCard}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{article.title}</span>
        <span className="text-xs text-slate-500">{article.slug}</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/40">
          {article.type}
        </span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-100">
          {article.status}
        </span>
      </div>
      {article.summary ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{article.summary}</p> : null}
      <p className="mt-1 text-[11px] text-slate-500">
        Категория: {article.category_id || "—"} · Прошивка: {article.firmware_id || "—"}
      </p>
    </Link>
  );
}

export function FlipperGuideCard({ guide, to }) {
  return (
    <FlipperArticleCard
      article={{ ...guide, type: guide.type || "guide_scenario" }}
      to={to}
    />
  );
}

export function FlipperVulnCard({ vuln, to }) {
  return (
    <FlipperArticleCard
      article={{ ...vuln, type: vuln.type || "vuln_check" }}
      to={to}
    />
  );
}
