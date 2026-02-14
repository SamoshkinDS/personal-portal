// encoding: utf-8
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const baseNavItems = [
  { id: "analytics", title: "Аналитика", icon: ChartIcon, link: "/analytics" },
  { id: "ai", title: "AI & ML", icon: BrainIcon, link: "/ai" },
  { id: "docs", title: "Документация", icon: DocsIcon, link: "/docs" },
  { id: "plants", title: "Растения", icon: LeafIcon, link: "/plants" },
  { id: "finance", title: "Финансы", icon: WalletIcon, link: "/accounting" },
  { id: "posts", title: "Посты", icon: PostIcon, link: "/posts" },
  { id: "vpn", title: "VPN", icon: VpnIcon, link: "/vpn" },
  { id: "settings", title: "Настройки", icon: CogIcon, link: "/settings" },
];

const CONTEXT_SECTIONS = [
  {
    id: "plants",
    match: (path) =>
      path.startsWith("/plants") ||
      path.startsWith("/pests") ||
      path.startsWith("/problems") ||
      path.startsWith("/diseases") ||
      path.startsWith("/medicines"),
    items: [
      { title: "Каталог", link: "/plants", icon: LeafIcon },
      { title: "Проблемы", link: "/problems", icon: ProblemIcon },
      { title: "Вредители", link: "/pests", icon: PestIcon },
      { title: "Заболевания", link: "/diseases", icon: DiseaseIcon },
      { title: "Лекарства", link: "/medicines", icon: MedicineIcon },
      { title: "Настройки", link: "/plants/settings", icon: CogIcon },
    ],
  },
  {
    id: "vpn",
    match: (path) => path.startsWith("/vpn"),
    items: [
      { title: "Главная", link: "/vpn", icon: VpnIcon },
      { title: "Outline", link: "/vpn/outline", icon: OutlineIcon },
      { title: "VLESS", link: "/vpn/vless", icon: KeyIcon },
      { title: "Гайды", link: "/vpn/vless/guide", icon: GuideIcon },
      { title: "Маршруты", link: "/vpn/vless/routes-guide", icon: RouteIcon },
    ],
  },
  {
    id: "ai",
    match: (path) => path.startsWith("/ai"),
    items: [
      { title: "Обзор", link: "/ai", icon: BrainIcon },
      { title: "N8N", link: "/ai/n8n", icon: WorkflowIcon },
    ],
  },
  {
    id: "accounting",
    match: (path) => path.startsWith("/accounting"),
    items: [
      { title: "Дашборд", link: "/accounting", icon: ChartIcon },
      { title: "Счета", link: "/accounting/accounts", icon: WalletIcon },
      { title: "Платежи", link: "/accounting/payments", icon: PaymentIcon },
      { title: "Долги", link: "/accounting/debts", icon: PaymentIcon },
      { title: "Транзакции", link: "/accounting/transactions", icon: TransferIcon },
      { title: "Доходы", link: "/accounting/incomes", icon: IncomeIcon },
      { title: "Категории", link: "/accounting/categories", icon: TagIcon },
      { title: "Настройки", link: "/accounting/settings", icon: CogIcon },
    ],
  },
  {
    id: "admin",
    match: (path) => path.startsWith("/admin"),
    items: [
      { title: "Главная", link: "/admin", icon: ShieldIcon },
      { title: "Пользователи", link: "/admin/users", icon: UsersIcon },
      { title: "Контент", link: "/admin/content", icon: DocsIcon },
      { title: "Журнал", link: "/admin/logs", icon: ActivityIcon },
    ],
  },
];

export default function MobileNavCarousel() {
  return null;
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

function BackIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ProblemIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22V12" />
      <path d="M5 7c3 0 7 2 7 5" />
      <path d="M19 7c-3 0-7 2-7 5" />
      <path d="M4 21h16" />
    </svg>
  );
}

function PestIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
    </svg>
  );
}

function DiseaseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="m22 2-5 5" />
      <path d="M14 8h.01" />
      <path d="M9 13h.01" />
      <path d="M13 16h.01" />
    </svg>
  );
}

function MedicineIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="18" rx="3.5" />
      <rect x="14" y="3" width="7" height="18" rx="3.5" />
      <path d="M7 8h9" />
    </svg>
  );
}

function OutlineIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3v5" />
      <path d="M18 3v5" />
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 13h18" />
    </svg>
  );
}

function KeyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 7a5 5 0 0 0-4 8l-4 4v4h4l4-4a5 5 0 1 0 0-8Z" />
      <path d="M15 7a5 5 0 0 1 4 8" />
      <path d="M16 16l-4.5-4.5" />
    </svg>
  );
}

function GuideIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3h10l4 4v14H7z" />
      <path d="M7 3v18H3V7z" />
      <path d="M13 8h4" />
      <path d="M13 12h4" />
      <path d="M13 16h4" />
    </svg>
  );
}

function RouteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v4a2 2 0 0 0 2 2h4" />
      <path d="m15 8 3-3" />
    </svg>
  );
}

function WorkflowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <path d="M7 10v4a1 1 0 0 0 1 1h4" />
      <path d="m14 10 3 3-3 3" />
    </svg>
  );
}

function PaymentIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function TransferIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m4 17 6-6 4 4 6-6" />
      <path d="M14 7h6v6" />
    </svg>
  );
}

function IncomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function TagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.59 13.41 11 3.82A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59A2 2 0 0 0 3.82 11l9.59 9.59a2 2 0 0 0 2.82 0l4.36-4.36a2 2 0 0 0 0-2.82Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12H2" />
      <path d="M7 12l3 7 4-14 3 7" />
    </svg>
  );
}
