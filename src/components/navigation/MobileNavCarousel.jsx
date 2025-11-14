// encoding: utf-8
import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { title: "Аналитика", icon: ChartIcon, link: "/analytics" },
  { title: "AI & ML", icon: BrainIcon, link: "/ai" },
  { title: "Документация", icon: DocsIcon, link: "/docs" },
  { title: "Растения", icon: LeafIcon, link: "/plants" },
  { title: "Финансы", icon: WalletIcon, link: "/accounting" },
  { title: "Посты", icon: PostIcon, link: "/posts" },
  { title: "VPN", icon: VpnIcon, link: "/vpn" },
  { title: "Настройки", icon: CogIcon, link: "/settings" },
];

export default function MobileNavCarousel() {
  const location = useLocation();

  return (
    <div className="md:hidden -mx-4 mb-2 sm:-mx-6">
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 sm:px-6 snap-x snap-mandatory">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.link);
          const Icon = item.icon;
          return (
            <Link
              key={item.link}
              to={item.link}
              className={`snap-start flex min-w-[110px] max-w-[130px] flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center text-xs font-semibold shadow-sm backdrop-blur ${
                active
                  ? "border-blue-400/60 bg-blue-500/10 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-100"
                  : "border-white/60 bg-white/70 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-xl shadow-sm ring-1 ring-black/5 dark:bg-slate-800/70 dark:ring-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[13px] leading-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ChartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20v-8" />
      <path d="M10 20V4" />
      <path d="M16 20v-5" />
      <path d="M22 20V9" />
    </svg>
  );
}

function BrainIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3a3 3 0 0 0-3 3v3a3 3 0 0 0 0 6v3a3 3 0 0 0 3 3" />
      <path d="M16 3a3 3 0 0 1 3 3v3a3 3 0 0 1 0 6v3a3 3 0 0 1-3 3" />
      <path d="M8 7h8" />
      <path d="M8 15h8" />
      <path d="M12 3v18" />
    </svg>
  );
}

function DocsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M14 4v6h6" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </svg>
  );
}

function LeafIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22C12 9 20 4 20 4 20 12 15 22 12 22Z" />
      <path d="M12 22C12 9 4 4 4 4c0 8 5 18 8 18Z" />
      <path d="M12 22V11" />
    </svg>
  );
}

function WalletIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 7a2 2 0 0 1 2-2h16a1 1 0 0 1 1 1v3" />
      <path d="M3 7v10a2 2 0 0 0 2 2h16a1 1 0 0 0 1-1v-5H15a2 2 0 0 1 0-4h7V6" />
      <circle cx="17" cy="12" r="1" />
    </svg>
  );
}

function PostIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5V5a1 1 0 0 1 1-1h10l5 5v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h7" />
      <path d="M8 17h5" />
    </svg>
  );
}

function VpnIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22c4.97 0 9-4.03 9-9S16.97 4 12 4 3 8.03 3 13c0 2.04.66 3.94 1.77 5.48a2 2 0 0 1 .33 1.11v1.41a1 1 0 0 0 1.45.89l2.55-1.27a2 2 0 0 1 1.78 0l2.55 1.27a1 1 0 0 0 1.45-.89v-1.41a2 2 0 0 1 .33-1.11A8.96 8.96 0 0 0 21 13" />
      <path d="M9 13h.01" />
      <path d="M12 13h.01" />
      <path d="M15 13h.01" />
    </svg>
  );
}

function CogIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.17a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14v-4a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.18A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.18a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.18A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
