// encoding: utf-8
import React from "react";

export const ENTITY_COLORS = {
  basic: "#3A82F7",
  feature_basic: "#3A82F7",
  firmware: "#8A3FFC",
  feature_custom_fw: "#8A3FFC",
  module: "#FF8A00",
  module_custom: "#FF8A00",
  guide: "#00B3A1",
  guide_scenario: "#00B3A1",
  vuln: "#E53935",
  vuln_check: "#E53935",
};

const ENTITY_ICONS = {
  basic: "🛰️",
  firmware: "💾",
  module: "🧩",
  guide: "📘",
  vuln: "⚠️",
};

export function getColorForType(type) {
  return ENTITY_COLORS[type] || "#3A82F7";
}

export function getIconForType(type) {
  if (!type) return "📟";
  if (type.includes("basic")) return ENTITY_ICONS.basic;
  if (type.includes("firmware")) return ENTITY_ICONS.firmware;
  if (type.includes("module")) return ENTITY_ICONS.module;
  if (type.includes("guide")) return ENTITY_ICONS.guide;
  if (type.includes("vuln")) return ENTITY_ICONS.vuln;
  return "📟";
}

export function FlipperBadge({ type, label }) {
  const color = getColorForType(type);
  return (
    <span
      className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
      style={{ backgroundColor: color }}
    >
      {label || type}
    </span>
  );
}

export function FlipperHeader({ title, subtitle, type, breadcrumbs }) {
  const color = getColorForType(type);
  const icon = getIconForType(type);
  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-5 shadow-lg dark:border-slate-800"
      style={{ boxShadow: `0 10px 30px ${color}22` }}
    >
      <div className="flex flex-col gap-3 text-white">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          {breadcrumbs?.length
            ? breadcrumbs.map((b, idx) => (
                <React.Fragment key={b.href || b.label}>
                  {idx > 0 ? <span className="text-white/40">→</span> : null}
                  {b.href ? (
                    <a href={b.href} className="hover:underline">
                      {b.label}
                    </a>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </React.Fragment>
              ))
            : null}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{ backgroundColor: `${color}33` }}
          >
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-snug">{title}</h1>
            {subtitle ? <p className="text-sm text-white/80">{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StickyAside({ children }) {
  return (
    <aside className="hidden lg:block lg:w-64">
      <div className="sticky top-4 space-y-3">{children}</div>
    </aside>
  );
}

export function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}
