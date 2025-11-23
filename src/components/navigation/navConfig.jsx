// encoding: utf-8
import React from "react";

export const NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h5v-5h4v5h5V10" />
    </svg>
  ),
  apartment: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="8" height="18" rx="1.5" />
      <rect x="13" y="7" width="8" height="14" rx="1.5" />
      <path d="M7 7h.01M7 11h.01M7 15h.01M17 11h.01M17 15h.01M17 19h.01" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M22 20v-9" />
    </svg>
  ),
  career: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <path d="M9 8V5h6v3" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3a5 5 0 0 1 5 5v1a3 3 0 0 0 0 6v1a5 5 0 0 1-10 0v-1a3 3 0 0 0 0-6V8a5 5 0 0 1 5-5Z" />
      <path d="M12 6v12" />
      <path d="M8 10h8" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 13h18" />
      <path d="M5 17h2" />
      <path d="M17 17h2" />
      <path d="M5 13 7.5 7.5a2 2 0 0 1 1.8-1.2h5.4a2 2 0 0 1 1.8 1.2L19 13" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </svg>
  ),
  docs: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M15 3v5h4" />
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 4.5h10l4 4v11h-14z" />
      <path d="M15 4.5v4h4" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  plants: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 22V11" />
      <path d="M12 11c-4 0-6.5-2.5-6.5-6.5 4 0 6.5 2 6.5 6.5Z" />
      <path d="M12 11c0-4.5 2.5-6.5 6.5-6.5 0 4-2.5 6.5-6.5 6.5Z" />
      <path d="M12 22c0-3 2-6 5-8" />
      <path d="M12 22c0-3-2-6-5-8" />
    </svg>
  ),
  accounting: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="4" width="7" height="16" rx="2" />
      <rect x="14" y="4" width="7" height="16" rx="2" />
      <path d="M7 8h.01M7 12h.01M7 16h.01M18 8h.01M18 12h.01M18 16h.01" />
    </svg>
  ),
  vpn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 3 7.5 12 12l9-4.5Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17.5 12 22l9-4.5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15.4 9a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 20c14 0 14-13 14-13s-7-4-14 2c-3 3-2 11 3 11Z" />
      <path d="M5 20c6 0 10-6 10-6" />
    </svg>
  ),
  bug: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M9 8V5a3 3 0 0 1 6 0v3" />
      <path d="M6 11h12" />
      <path d="M6 15h12" />
      <path d="M9 19h6" />
      <path d="M5 7 3 5" />
      <path d="m19 5-2 2" />
      <path d="M5 19l2-2" />
      <path d="m19 19-2-2" />
      <rect x="7" y="8" width="10" height="12" rx="2" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3 4 6v6c0 5 4 7.7 8 9 4-1.3 8-4 8-9V6Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 19.5V5a1 1 0 0 1 1-1h10l4 4v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M9 10v6" />
      <path d="M13 12v4" />
      <path d="M17 9v7" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7 4h8l4 4v12H7Z" />
      <path d="M15 8H7" />
      <path d="M15 12H7" />
      <path d="M11 16H7" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="m7 7 2-2 3 3-2 2z" />
      <path d="m3 21 6-6 4 4-6 2z" />
      <path d="m12 8 6.5 6.5a2 2 0 0 1-2.8 2.8L9.2 10.8" />
      <path d="m14 4 6 6" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="4" width="8" height="16" rx="2" />
      <rect x="13" y="8" width="8" height="12" rx="2" />
      <path d="M7 8h.01M7 12h.01M7 16h.01M17 12h.01M17 16h.01" />
    </svg>
  ),
  flipper: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="5" y="4" width="14" height="16" rx="3" />
      <rect x="8" y="7" width="8" height="4" rx="1" />
      <path d="M9 15h6" />
      <circle cx="12" cy="17.5" r="1" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M18 10a4 4 0 0 0-7.9-1.2A3 3 0 0 0 6 11a3 3 0 0 0 .3 1.3A3.5 3.5 0 0 0 7 18.5h9a4 4 0 0 0 2-7.5Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
    </svg>
  ),
};

export const DEFAULT_NAV_ITEMS = [
  { id: "home", path: "/", label: "Главная", icon: NAV_ICONS.home },
  { id: "apartment", path: "/home", label: "Квартира", icon: NAV_ICONS.apartment },
  { id: "car", path: "/car", label: "Авто", icon: NAV_ICONS.car },
  {
    id: "analytics",
    path: "/analytics",
    label: "Аналитика",
    icon: NAV_ICONS.analytics,
    children: [
      { id: "analytics-home", path: "/analytics", label: "Обзор", icon: NAV_ICONS.chart },
      { id: "analytics-queue", path: "/analytics/queue", label: "Очередь статей", icon: NAV_ICONS.doc },
      { id: "analytics-interview", path: "/analytics/interview", label: "Интервью", icon: NAV_ICONS.doc },
      { id: "analytics-cheats", path: "/analytics/cheats", label: "Шпаргалки", icon: NAV_ICONS.doc },
      { id: "analytics-tests", path: "/analytics/tests", label: "Тесты", icon: NAV_ICONS.chart },
      { id: "analytics-settings", path: "/analytics/settings", label: "Настройки", icon: NAV_ICONS.settings },
    ],
  },
  {
    id: "career",
    path: "/career",
    label: "Карьера",
    icon: NAV_ICONS.career,
    children: [
      { id: "career-dashboard", path: "/career", label: "Дашборд", icon: NAV_ICONS.home },
      { id: "career-skills", path: "/career/skills", label: "Навыки", icon: NAV_ICONS.chart },
      { id: "career-courses", path: "/career/courses", label: "Курсы", icon: NAV_ICONS.doc },
      { id: "career-portfolio", path: "/career/portfolio", label: "Портфолио", icon: NAV_ICONS.doc },
      { id: "career-timeline", path: "/career/portfolio/timeline", label: "Таймлайн", icon: NAV_ICONS.chart },
      { id: "career-analytics", path: "/career/analytics", label: "Аналитика", icon: NAV_ICONS.chart },
      { id: "career-interviews", path: "/career/interviews", label: "Интервью", icon: NAV_ICONS.doc },
      { id: "career-knowledge", path: "/career/knowledge", label: "Знания", icon: NAV_ICONS.doc },
      { id: "career-export", path: "/career/portfolio/export", label: "Экспорт", icon: NAV_ICONS.doc },
    ],
  },
  {
    id: "ai",
    path: "/ai",
    label: "AI & ML",
    icon: NAV_ICONS.ai,
    children: [
      { id: "ai-overview", path: "/ai", label: "Обзор", icon: NAV_ICONS.home },
      { id: "ai-n8n", path: "/ai/n8n", label: "n8n", icon: NAV_ICONS.chart },
      { id: "ai-promptmaster", path: "/ai/promptmaster", label: "Promptmaster", icon: NAV_ICONS.doc },
    ],
  },
  { id: "flipper", path: "/flipper", label: "Flipper Zero", icon: NAV_ICONS.flipper },
  {
    id: "accounting",
    path: "/accounting",
    label: "Финансы",
    icon: NAV_ICONS.accounting,
    children: [
      { id: "accounting-dashboard", path: "/accounting", label: "Дашборд", icon: NAV_ICONS.chart },
      { id: "accounting-accounts", path: "/accounting/accounts", label: "Счета", icon: NAV_ICONS.doc },
      { id: "accounting-payments", path: "/accounting/payments", label: "Платежи", icon: NAV_ICONS.doc },
      { id: "accounting-transactions", path: "/accounting/transactions", label: "Транзакции", icon: NAV_ICONS.doc },
      { id: "accounting-incomes", path: "/accounting/incomes", label: "Доходы", icon: NAV_ICONS.doc },
      { id: "accounting-categories", path: "/accounting/categories", label: "Категории", icon: NAV_ICONS.doc },
      { id: "accounting-settings", path: "/accounting/settings", label: "Настройки", icon: NAV_ICONS.settings },
    ],
  },
  {
    id: "vpn",
    path: "/vpn",
    label: "VPN",
    icon: NAV_ICONS.vpn,
    children: [
      { id: "vpn-home", path: "/vpn", label: "Обзор", icon: NAV_ICONS.home },
      { id: "vpn-outline", path: "/vpn/outline", label: "Outline", icon: NAV_ICONS.shield },
      { id: "vpn-outline-guide", path: "/vpn/outline/guide", label: "Гайд Outline", icon: NAV_ICONS.doc },
      { id: "vpn-vless", path: "/vpn/vless", label: "VLESS", icon: NAV_ICONS.shield },
      { id: "vpn-vless-guide", path: "/vpn/vless/guide", label: "Гайд VLESS", icon: NAV_ICONS.doc },
      { id: "vpn-routes", path: "/vpn/vless/routes-guide", label: "Маршруты", icon: NAV_ICONS.chart },
    ],
  },
  {
    id: "plants",
    path: "/plants",
    label: "Растения",
    icon: NAV_ICONS.plants,
    children: [
      { id: "plants-list", path: "/plants", label: "Каталог", icon: NAV_ICONS.leaf },
      { id: "plants-tools", path: "/plants/tools", label: "Инструменты", icon: NAV_ICONS.tools },
      { id: "plants-problems", path: "/problems", label: "Проблемы", icon: NAV_ICONS.shield },
      { id: "plants-pests", path: "/pests", label: "Вредители", icon: NAV_ICONS.bug },
      { id: "plants-diseases", path: "/diseases", label: "Болезни", icon: NAV_ICONS.shield },
      { id: "plants-medicines", path: "/medicines", label: "Лекарства", icon: NAV_ICONS.doc },
      { id: "plants-settings", path: "/plants/settings", label: "Настройки", icon: NAV_ICONS.settings },
    ],
  },
  {
    id: "admin",
    path: "/admin",
    label: "Администрирование",
    icon: NAV_ICONS.admin,
    children: [
      { id: "admin-home", path: "/admin", label: "Обзор", icon: NAV_ICONS.home },
      { id: "admin-users", path: "/admin/users", label: "Пользователи", icon: NAV_ICONS.doc },
      { id: "admin-content", path: "/admin/content", label: "Контент", icon: NAV_ICONS.doc },
      { id: "admin-logs", path: "/admin/logs", label: "Логи", icon: NAV_ICONS.chart },
      { id: "admin-s3", path: "/admin/s3", label: "S3 Storage", icon: NAV_ICONS.cloud },
      { id: "admin-flipper", path: "/admin/flipper", label: "Flipper Zero", icon: NAV_ICONS.flipper },
    ],
  },
  { id: "docs", path: "/docs", label: "Документация", icon: NAV_ICONS.docs },
  { id: "posts", path: "/posts", label: "Посты", icon: NAV_ICONS.posts },
  { id: "settings", path: "/settings", label: "Настройки", icon: NAV_ICONS.settings },
];

export function cloneNavItems(items) {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneNavItems(item.children) : undefined,
  }));
}
